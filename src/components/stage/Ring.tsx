'use client';
/* eslint-disable react-hooks/immutability, react-hooks/refs --
   React Three Fiber drives three.js imperatively: uniforms, meshes and refs are mutated every frame
   inside useFrame by design, outside React's render cycle. */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { stories, posterSrc, posterBackSrc } from '@/content/stories';
import { stage, live, RING, chapterPosterRect, type Rect } from '@/lib/stage-store';
import { gsap } from '@/lib/gsap';
import { applyPageBg, hexToRgb } from '@/lib/theme';
import { posterFragment, posterVertex, textFragment, textVertex } from './shaders';
import { drawStoryLine, ensureFont, TEXT_CANVAS } from './storyCanvas';
import { bloom } from '@/lib/bloom';

export const CARD_W = 1.5;
export const CARD_H = 2;
const R = 2.25;
const STEP = (Math.PI * 2) / RING.count;
export const FOV = 30;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** How short an upright phone is (0 from 740px tall, 1 at 500px): the hero's captions take more of a short screen. */
function shortness(width: number, height: number) {
  return width < height ? clamp01((740 - height) / 240) : 0;
}

/** Camera distance per aspect: phones step back so the ring still reads as a ring, and short phones a little more. */
export function cameraDistance(aspect: number, short = 0) {
  if (aspect >= 1.3) return 10;
  const k = clamp01((aspect - 0.46) / (1.3 - 0.46));
  return (14.5 + (10 - 14.5) * k) * (1 + 0.14 * short);
}

// Deterministic per-card scatter offsets for the unwind.
const scatter = stories.map((_, i) => {
  const r = (n: number) => {
    const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    x: (r(2) - 0.5) * 2.4,
    y: 0.4 + r(3) * 1.4,
    z: (r(1) - 0.35) * 3.6,
    rx: (r(4) - 0.5) * 1.1,
    ry: (r(5) - 0.5) * 1.6,
    rz: (r(6) - 0.5) * 0.9,
    seed: r(7) * 10,
  };
});
// Cards leave the ring back-to-front relative to the last vow (index 6 sits in front at the unwind).
const departure = stories.map((_, i) => {
  const d = Math.abs(((i - 6 + 10.5) % 7) - 3.5);
  return (3.5 - d) / 3.5;
});

type Mode = 'ring' | 'flight' | 'chapter';

const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);
const IDENTITY = new THREE.Quaternion();

// Hover "pull": the card under the pointer lifts out of the ring toward the viewer, flattens and turns to face them.
const HOVER = {
  /** world units travelled toward the camera */
  lift: 1.55,
  /** and upward: the camera looks down on the ring, so a lifted card would otherwise grow off the bottom */
  rise: 0.34,
  /** a slight editorial roll, in radians */
  roll: -0.07,
  /** extra scale on top of the perspective growth */
  grow: 0.1,
  /** how far the card turns from its ring angle to face the camera (0..1) */
  face: 0.74,
  /** how much of the ring curvature it loses */
  flatten: 0.7,
  /** pointer tilt, in radians, at the screen edges */
  tiltX: 0.12,
  tiltY: 0.2,
};

export default function Ring() {
  const router = useRouter();
  const { camera, invalidate } = useThree();

  const urls = useMemo(() => stories.flatMap((s) => [posterSrc(s), posterBackSrc(s)]), []);
  const textures = useTexture(urls);
  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.NoColorSpace;
      t.anisotropy = 8;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.needsUpdate = true;
    });
  }, [textures]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(CARD_W, CARD_H, 56, 14), []);
  const materials = useMemo(
    () =>
      stories.map(
        (s, i) =>
          new THREE.ShaderMaterial({
            vertexShader: posterVertex,
            fragmentShader: posterFragment,
            side: THREE.DoubleSide,
            uniforms: {
              uFront: { value: textures[i * 2] },
              uBack: { value: textures[i * 2 + 1] },
              uBend: { value: 1 },
              uRadius: { value: R },
              uTime: { value: 0 },
              uWave: { value: 0 },
              uHover: { value: 0 },
              uSeed: { value: scatter[i].seed },
              uOpacity: { value: 1 },
              uGrain: { value: 0.035 },
              uShade: { value: 1 },
              uDim: { value: 0 },
            },
          }),
      ),
    [textures],
  );

  // Story text: two canvases cross-wiped by the text shader.
  const text = useMemo(() => {
    const make = () => {
      const c = document.createElement('canvas');
      c.width = TEXT_CANVAS.w;
      c.height = TEXT_CANVAS.h;
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.NoColorSpace;
      t.anisotropy = 8;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      return { c, t };
    };
    const a = make();
    const b = make();
    const ink = hexToRgb(stories[0].palette.ink);
    const material = new THREE.ShaderMaterial({
      vertexShader: textVertex,
      fragmentShader: textFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uA: { value: a.t },
        uB: { value: b.t },
        uMix: { value: 0 },
        uColA: { value: new THREE.Vector3(...ink) },
        uColB: { value: new THREE.Vector3(...ink) },
        uOpacity: { value: 0 },
      },
    });
    return { slots: [a, b], material, shown: -1, pending: -1, tween: null as gsap.core.Tween | null };
  }, []);

  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const textMesh = useRef<THREE.Mesh>(null);
  const mode = useRef<Mode>('ring');
  const hover = useRef<number | null>(null);
  const hoverVals = useRef(stories.map(() => 0));
  const hoverOut = useRef<number | undefined>(undefined);
  const tilt = useRef({ x: 0, y: 0 });
  const fontReady = useRef(false);
  const intro = useRef({ v: 0 });
  const flight = useRef({
    t: 0,
    index: -1,
    pushed: false,
    landed: false,
    leftHomeAt: -1,
    // The pose a card leaves from: usually mid hover-pull, so its curve and shading are captured too.
    from: { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: 1, bend: 1, shade: 1 },
  });
  const fade = useRef({ v: 1 });
  // Touch screens have no hover: the front card lifts out on its own once the ring comes to rest on a vow.
  const coarse = useRef(false);
  const rest = useRef({ p: -1, since: 0 });
  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const update = () => (coarse.current = mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // scratch objects
  const s = useMemo(
    () => ({
      tiltQ: new THREE.Quaternion(),
      euler: new THREE.Euler(),
      euler2: new THREE.Euler(),
      ringPos: new THREE.Vector3(),
      ringQuat: new THREE.Quaternion(),
      pos: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      extra: new THREE.Quaternion(),
      target: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      toCam: new THREE.Vector3(),
      look: new THREE.Vector3(),
      faceQ: new THREE.Quaternion(),
      tiltQ2: new THREE.Quaternion(),
      euler3: new THREE.Euler(),
    }),
    [],
  );

  // ---- story text swapping ----
  useEffect(() => {
    let cancelled = false;
    const show = (i: number) => {
      const story = stories[i];
      if (!story || !fontReady.current) return;
      const u = text.material.uniforms;
      const [a] = text.slots;
      if (text.shown === -1) {
        drawStoryLine(a.c, story.heroLine);
        a.t.needsUpdate = true;
        u.uColA.value.set(...hexToRgb(story.palette.ink));
        text.shown = i;
        invalidate();
        return;
      }
      if (i === text.shown && !text.tween) return;
      // Mid-wipe: if B is mostly shown, adopt it as the base before starting again.
      if (text.tween) {
        text.tween.kill();
        text.tween = null;
        if (u.uMix.value > 0.5) {
          text.slots.reverse();
          u.uA.value = text.slots[0].t;
          u.uB.value = text.slots[1].t;
          u.uColA.value.copy(u.uColB.value);
        }
        u.uMix.value = 0;
        if (i === text.shown) return;
      }
      const next = text.slots[1];
      drawStoryLine(next.c, story.heroLine);
      next.t.needsUpdate = true;
      u.uB.value = next.t;
      u.uColB.value.set(...hexToRgb(story.palette.ink));
      text.shown = i;
      text.tween = gsap.to(u.uMix, {
        value: 1,
        duration: 1,
        ease: 'power2.inOut',
        onComplete: () => {
          text.slots.reverse();
          u.uA.value = text.slots[0].t;
          u.uB.value = text.slots[1].t;
          u.uColA.value.copy(u.uColB.value);
          u.uMix.value = 0;
          text.tween = null;
        },
      });
    };

    ensureFont().then(() => {
      if (cancelled) return;
      fontReady.current = true;
      show(stage.get().activeIndex);
      gsap.to(intro.current, { v: 1, duration: 1.6, delay: 0.3, ease: 'power2.out' });
    });
    const unsub = stage.subscribe(() => show(stage.get().activeIndex));
    return () => {
      cancelled = true;
      unsub();
    };
  }, [text, invalidate]);

  useEffect(() => {
    stage.set({ ready: true });
  }, []);

  // ---- route changes: back on the home page restores the ring ----
  useEffect(() => {
    const unsub = stage.subscribe(() => {
      const st = stage.get();
      if (st.home && mode.current === 'chapter') {
        mode.current = 'ring';
        fade.current.v = 1;
        materials.forEach((m) => (m.uniforms.uOpacity.value = 1));
      }
      if ((!st.home || st.handoff) && hover.current != null) {
        hover.current = null;
        stage.set({ hoverIndex: null, cursor: 'default', cursorLabel: null });
      }
      if (!st.home && !st.flight && mode.current === 'ring') {
        // Direct navigation away (link, not a card flight): hide the ring.
        mode.current = 'chapter';
      }
    });
    return () => {
      unsub();
    };
  }, [materials]);

  // ---- chapter flight ----
  const startFlight = (i: number) => {
    if (mode.current !== 'ring' || stage.get().flight) return;
    const story = stories[i];
    const mesh = meshes.current[i];
    if (!story || !mesh) return;
    mode.current = 'flight';
    const f = flight.current;
    f.t = 0;
    f.index = i;
    f.pushed = false;
    f.landed = false;
    f.leftHomeAt = -1;
    f.from.pos.copy(mesh.position);
    f.from.quat.copy(mesh.quaternion);
    f.from.scale = mesh.scale.x;
    f.from.bend = materials[i].uniforms.uBend.value;
    f.from.shade = materials[i].uniforms.uShade.value;
    live.returnIndex = i;
    live.chapterPoster = null;
    live.chapterPosterLoaded = false;
    stage.set({ flight: { index: i, slug: story.slug }, hoverIndex: null, cursor: 'default', cursorLabel: null });
    hover.current = null;
    live.lenis?.stop();
    applyPageBg(story.palette.pageBg, 1.3);
    gsap.to(document.documentElement, { '--ink': story.palette.pageInk, '--tint': story.palette.pageBg, duration: 1.1, ease: 'power2.inOut' });
    gsap.to(f, {
      t: 1,
      duration: 1.55,
      ease: 'none',
      onUpdate: () => {
        if (!f.pushed && f.t > 0.42) {
          f.pushed = true;
          router.push(`/stories/${story.slug}`);
        }
      },
      onComplete: () => {
        f.landed = true;
      },
    });
  };

  const startFlightRef = useRef(startFlight);
  startFlightRef.current = startFlight;
  useEffect(() => {
    live.flyTo = (i: number) => startFlightRef.current(i);
    return () => {
      live.flyTo = null;
    };
  }, []);

  // Chapter routes are prefetched once the ring is idle, so a card flight never waits on the network.
  useEffect(() => {
    const prefetch = () => stories.forEach((st) => router.prefetch(`/stories/${st.slug}`));
    const id = window.setTimeout(prefetch, 2500);
    return () => window.clearTimeout(id);
  }, [router]);

  const clearHover = () => {
    window.clearTimeout(hoverOut.current);
    if (hover.current == null) return;
    hover.current = null;
    stage.set({ hoverIndex: null, cursor: 'default', cursorLabel: null });
  };
  const onOver = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    // A finger dragging the page across a card is a scroll, not a hover; touch gets its own pull in the frame loop.
    if (e.nativeEvent.pointerType !== 'mouse') return;
    if (mode.current !== 'ring' || live.progress > RING.aEnd + 0.01) return;
    if (!interactive(e.object) || !facesCamera(e.object)) return;
    e.stopPropagation();
    window.clearTimeout(hoverOut.current);
    hover.current = i;
    stage.set({ hoverIndex: i, cursor: 'explore', cursorLabel: stories[i].posterTitle.join(' ') });
  };
  // A short grace period: the lifted card moves under the pointer, and its edge must not flicker in and out.
  const onOut = (i: number) => () => {
    if (hover.current !== i) return;
    window.clearTimeout(hoverOut.current);
    hoverOut.current = window.setTimeout(() => {
      if (hover.current === i) clearHover();
    }, 140);
  };
  useEffect(() => () => window.clearTimeout(hoverOut.current), []);
  const onClick = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    const t = e.nativeEvent.target as HTMLElement | null;
    if (t?.closest?.('a,button,input,textarea,select,[data-no-stage]')) return;
    if (mode.current !== 'ring' || live.progress > RING.aEnd + 0.01) return;
    if (!interactive(e.object) || !facesCamera(e.object)) return;
    e.stopPropagation();
    if (coarse.current) bloom(e.nativeEvent.clientX, e.nativeEvent.clientY, 'Explore');
    startFlight(i);
  };

  // three.js raycasts hidden meshes too, so only the visible home ring may take pointer input.
  function interactive(obj: THREE.Object3D) {
    const st = stage.get();
    return obj.visible && st.home && !st.handoff && !st.drawer && st.film == null;
  }

  function facesCamera(obj: THREE.Object3D) {
    s.normal.copy(Z).applyQuaternion(obj.quaternion);
    s.toCam.copy(camera.position).sub(obj.position).normalize();
    return s.normal.dot(s.toCam) > 0.25;
  }

  useFrame((state, delta) => {
    const { size, clock } = state;
    const time = clock.elapsedTime;
    const aspect = size.width / size.height;
    const short = shortness(size.width, size.height);
    const D = cameraDistance(aspect, short);
    const H0 = 2 * D * TAN;
    const wpp = H0 / size.height;
    const st = stage.get();
    const f = flight.current;
    const flying = mode.current === 'flight';

    // Land the flight once the chapter page is mounted and its poster has loaded. The card waits on its
    // target rect while the route resolves; a missing image never strands it for more than 2.5s.
    if (flying && !st.home && f.leftHomeAt < 0) f.leftHomeAt = time;
    if (flying && f.landed && !st.home) {
      const posterReady = live.chapterPosterLoaded || time - f.leftHomeAt > 2.5;
      if (posterReady) {
        mode.current = 'chapter';
        f.landed = false;
        stage.set({ flight: null });
        live.lenis?.start();
      }
    }

    const p = live.progress;
    const pA = clamp01(p / RING.aEnd);
    const pB = clamp01((p - RING.aEnd) / (1 - RING.aEnd));
    const fT = flying || mode.current === 'chapter' ? easeInOut(f.t) : 0;

    // Camera: elevated during the ring, square-on for the lookbook handoff and the flight.
    const straight = Math.max(easeInOut(pB), fT);
    camera.position.set(0, D * 0.13 * (1 - straight), D);
    // Short phones also aim a little lower, which lifts the ring clear of the captions; square-on again for the handoff.
    s.look.set(0, (-0.12 - 0.4 * short) * (1 - straight), 0);
    camera.lookAt(s.look);

    const idxFloat = pA * (RING.count - 1);
    const active = Math.round(idxFloat);
    if (mode.current === 'ring' && st.home && active !== st.activeIndex) stage.set({ activeIndex: active });

    const reduced = live.reduced;
    const sway = reduced ? 0 : Math.sin(time * 0.35) * 0.03 * (1 - pB);
    const ringRot = -idxFloat * STEP + sway;
    const radius = R + pB * 1.4;
    const unwind = smooth(0, 0.55, pB);
    const tiltX = 0.3 * (1 - unwind);
    const tiltZ = 0.07 * (1 - unwind);
    const scrollOffset = flying || mode.current === 'chapter' ? 0 : -live.heroTop * wpp;
    const groupY = (H0 * 0.01 + (reduced ? 0 : Math.sin(time * 0.6) * 0.03)) * (1 - pB) + scrollOffset;
    s.tiltQ.setFromEuler(s.euler.set(tiltX, 0, tiltZ));

    const hidden = mode.current === 'chapter' || (mode.current === 'ring' && (st.handoff || !st.home));
    const introV = intro.current.v;

    // Touch: once the scroll has rested on a vow for a moment, the front card is pulled as if hovered.
    const touch = coarse.current;
    const r = rest.current;
    if (Math.abs(p - r.p) > 0.0004) {
      r.p = p;
      r.since = time;
    }
    const restPick =
      touch && mode.current === 'ring' && st.home && !st.handoff && !st.drawer && st.film == null && p <= RING.aEnd + 0.001 && introV > 0.95 && time - r.since > 0.45
        ? active
        : null;
    const pick = hover.current ?? restPick;

    // Hover state shared by the loop: the pointer (smoothed) tilts the pulled card; the others step back.
    // Without a pointer, the pulled card drifts on a slow figure-of-eight instead.
    const tp = tilt.current;
    const px = touch ? Math.sin(time * 0.7) * 0.55 : state.pointer.x;
    const py = touch ? Math.sin(time * 0.5 + 1) * 0.4 : state.pointer.y;
    tp.x += (px - tp.x) * Math.min(1, delta * 4);
    tp.y += (py - tp.y) * Math.min(1, delta * 4);
    const hoverMax = Math.max(...hoverVals.current) * (1 - pB);

    for (let i = 0; i < RING.count; i++) {
      const mesh = meshes.current[i];
      if (!mesh) continue;
      const u = materials[i].uniforms;
      u.uTime.value = time;
      mesh.visible = !hidden;
      if (hidden) continue;

      // Ring pose
      const theta = i * STEP + ringRot;
      s.ringPos.set(radius * Math.sin(theta), 0, radius * Math.cos(theta)).applyQuaternion(s.tiltQ);
      s.ringPos.y += groupY;
      s.ringQuat.setFromAxisAngle(Y, theta).premultiply(s.tiltQ);

      // Lookbook target (viewport px -> world at z = 0)
      const rect: Rect | null = live.targets[i] ?? null;
      let ts = 0.62;
      if (rect) {
        s.target.set((rect.x + rect.w / 2 - size.width / 2) * wpp, -(rect.y + rect.h / 2 - size.height / 2) * wpp, 0);
        ts = (rect.w * wpp) / CARD_W;
      } else {
        s.target.set((i - 3) * 1.2, -H0 * (0.2 + (i % 3) * 0.6), 0);
      }

      const delay = departure[i] * 0.22;
      const e = easeInOut(clamp01((pB - delay) / (1 - 0.22)));
      const arc = Math.sin(Math.PI * e);
      const sc = scatter[i];

      s.pos.lerpVectors(s.ringPos, s.target, e);
      s.pos.x += sc.x * arc;
      s.pos.y += sc.y * arc;
      s.pos.z += sc.z * arc;
      s.quat.slerpQuaternions(s.ringQuat, IDENTITY, e);
      s.extra.setFromEuler(s.euler2.set(sc.rx * arc, sc.ry * arc, sc.rz * arc));
      s.quat.multiply(s.extra);
      let scale = 1 + (ts - 1) * e;

      let bend = 1 - smooth(0.05, 0.75, e);
      let wave = arc * 0.9;
      let shade = 1 - e;
      let grain = 0.035 * (1 - e);
      let opacity = introV;

      // Flight overrides
      if (flying || mode.current === 'chapter') {
        if (i === f.index) {
          const dom = live.chapterPoster ?? chapterPosterRect(size.width, size.height);
          s.target.set((dom.x + dom.w / 2 - size.width / 2) * wpp, -(dom.y + dom.h / 2 - size.height / 2) * wpp, 0);
          const tScale = (dom.w * wpp) / CARD_W;
          s.pos.lerpVectors(f.from.pos, s.target, fT);
          s.pos.z += Math.sin(Math.PI * fT) * 1.2;
          s.quat.slerpQuaternions(f.from.quat, IDENTITY, fT);
          scale = f.from.scale + (tScale - f.from.scale) * fT;
          bend = f.from.bend * (1 - smooth(0, 0.7, fT));
          wave = Math.sin(Math.PI * fT) * 0.35;
          shade = f.from.shade * (1 - fT);
          grain = 0.035 * (1 - fT);
        } else {
          opacity *= 1 - smooth(0, 0.35, fT);
          s.pos.y -= fT * 1.6;
        }
      }

      // Dim cards turning away from the camera (measured on the ring pose, before any hover pull)
      s.normal.copy(Z).applyQuaternion(s.quat);
      s.toCam.copy(camera.position).sub(s.pos).normalize();
      const facing = s.normal.dot(s.toCam);

      // Hover: the hovered card eases toward 1, the rest toward 0.
      const hv = hoverVals.current;
      // The touch pull lets go faster than it lifts, so the ring turns freely the moment a finger moves.
      const goal = pick === i ? 1 : 0;
      hv[i] += (goal - hv[i]) * Math.min(1, delta * (touch && goal === 0 ? 9 : touch ? 3.2 : 6.5));
      // Scrolling can turn a hovered card away; it lets go below the threshold it was picked up at.
      if (hover.current === i && facing < 0.2) clearHover();
      const h = mode.current === 'ring' ? hv[i] * hv[i] * (3 - 2 * hv[i]) * (1 - pB) : 0;
      if (h > 0.0005) {
        // Pulled out of the ring toward the viewer, turned to face them with a little pointer tilt, and flattened.
        // Touch pulls while the visitor is reading the story line, so the card comes forward less and sinks a little
        // instead of rising over the words.
        s.pos.addScaledVector(s.toCam, HOVER.lift * h * (reduced ? 0.5 : 1) * (touch ? 0.5 : 1));
        s.pos.y += (touch ? -0.12 : HOVER.rise) * h;
        s.euler3.set(reduced ? 0 : -tp.y * HOVER.tiltX, reduced ? 0 : tp.x * HOVER.tiltY, HOVER.roll);
        s.faceQ.copy(camera.quaternion).multiply(s.tiltQ2.setFromEuler(s.euler3));
        s.quat.slerp(s.faceQ, HOVER.face * h);
        scale *= 1 + HOVER.grow * h;
        bend *= 1 - HOVER.flatten * h;
        shade *= 1 - 0.6 * h;
      }
      // While one card is pulled out, the rest of the ring steps back.
      const recede = Math.max(0, hoverMax - hv[i] * (1 - pB));

      mesh.position.copy(s.pos);
      mesh.quaternion.copy(s.quat);
      mesh.scale.setScalar(scale);
      u.uBend.value = bend;
      u.uWave.value = reduced ? 0 : wave;
      u.uHover.value = hv[i] * (1 - pB);
      u.uShade.value = shade;
      u.uGrain.value = grain;
      u.uDim.value = Math.max((1 - smooth(-0.1, 0.85, facing)) * (1 - e) * (1 - fT), recede * 0.6);
      u.uOpacity.value = opacity;
      const m = materials[i];
      const transparent = opacity < 0.999;
      if (m.transparent !== transparent) {
        m.transparent = transparent;
        m.depthWrite = !transparent;
      }
    }

    // Story text plane: faces the camera inside the ring, so front cards cover it and it covers the back ones.
    const tm = textMesh.current;
    if (tm) {
      const tu = text.material.uniforms;
      const w = aspect >= 1 ? H0 * aspect * 0.36 : H0 * aspect * 0.86;
      const grow = 1 + pB * 0.35;
      tm.scale.set(w * grow, (w / 2) * grow, 1);
      tm.position.set(0, H0 * (aspect >= 1 ? 0.105 : 0.13) + scrollOffset, 0);
      tm.quaternion.copy(camera.quaternion);
      const textOpacity = hidden ? 0 : introV * (1 - smooth(0, 0.28, pB)) * (1 - smooth(0, 0.2, fT)) * (1 - (touch ? 0 : 0.35) * hoverMax);
      tu.uOpacity.value = textOpacity;
      tm.visible = textOpacity > 0.001;
    }
  });

  return (
    <>
      {stories.map((story, i) => (
        <mesh
          key={story.slug}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={geometry}
          material={materials[i]}
          onPointerOver={onOver(i)}
          onPointerOut={onOut(i)}
          onClick={onClick(i)}
        />
      ))}
      <mesh ref={textMesh} material={text.material} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </>
  );
}
