"use client";

import * as React from "react";
import { createControlHistoryGroupId } from "@/toolcraft/ui";

import { useToolcraftStore } from "../app-shell/toolcraft-store-context";
import {
  beginToolcraftOrientationInteraction,
  type ToolcraftOrientationInteractionLease,
} from "./orientation-interaction-coordinator";
import {
  getToolcraftOrientationPoseFromPointerDelta,
  readToolcraftOrientationPose,
} from "./orientation-gizmo-math";

export type ToolcraftModelOrbitHitTest = (
  clientX: number,
  clientY: number,
) => boolean;

export type ToolcraftModelOrbitInteractionOptions = {
  enabled?: boolean;
  hitTest: ToolcraftModelOrbitHitTest;
  historyLabel?: string;
  target: string;
};

export type ToolcraftModelOrbitInteractionHandlers<
  Element extends HTMLElement,
> = {
  onPointerCancel: React.PointerEventHandler<Element>;
  onPointerDown: React.PointerEventHandler<Element>;
  onLostPointerCapture: React.PointerEventHandler<Element>;
  onPointerMove: React.PointerEventHandler<Element>;
  onPointerUp: React.PointerEventHandler<Element>;
};

type OrbitGesture = {
  element: Element;
  historyGroup: string;
  lastX: number;
  lastY: number;
  lastMoveAt: number;
  pendingDeltaX: number;
  pendingDeltaY: number;
  pointerId: number;
  interaction: ToolcraftOrientationInteractionLease;
  velocityX: number;
  velocityY: number;
};

type OrbitInertia = {
  historyGroup: string;
  interaction: ToolcraftOrientationInteractionLease;
  lastFrameAt: number;
  velocityX: number;
  velocityY: number;
};

const MAX_ORBIT_VELOCITY_PER_FRAME = 12;

function releaseOrbitPointerCapture(gesture: OrbitGesture): void {
  if (gesture.element.hasPointerCapture?.(gesture.pointerId)) {
    gesture.element.releasePointerCapture?.(gesture.pointerId);
  }
}

function isUnmodifiedPrimaryPointer(
  event: Pick<
    React.PointerEvent<HTMLElement>,
    "altKey" | "button" | "ctrlKey" | "metaKey" | "shiftKey"
  >,
): boolean {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

export function useToolcraftModelOrbitInteraction<
  Element extends HTMLElement = HTMLElement,
>({
  enabled = true,
  historyLabel = "Model orbit",
  hitTest,
  target,
}: ToolcraftModelOrbitInteractionOptions): ToolcraftModelOrbitInteractionHandlers<Element> {
  const store = useToolcraftStore();
  const gestureRef = React.useRef<OrbitGesture | null>(null);
  const animationFrameRef = React.useRef(0);
  const inertiaRef = React.useRef<OrbitInertia | null>(null);
  const inertiaAnimationFrameRef = React.useRef(0);

  const writeOrbitDelta = React.useCallback(
    (
      interaction: ToolcraftOrientationInteractionLease,
      historyGroup: string,
      deltaX: number,
      deltaY: number,
    ): boolean => {
      if (deltaX === 0 && deltaY === 0) return true;
      const state = store.getState();
      const pose = readToolcraftOrientationPose(
        state.values[target],
        readToolcraftOrientationPose(state.defaults[target]),
      );

      return interaction.runOwnWrite(() => {
        store.dispatch({
          history: "merge",
          historyGroup,
          label: historyLabel,
          target,
          type: "controls.setValue",
          value: getToolcraftOrientationPoseFromPointerDelta(
            pose,
            deltaX,
            deltaY,
          ),
        });
      });
    },
    [historyLabel, store, target],
  );

  const applyPendingDelta = React.useCallback((): void => {
    const gesture = gestureRef.current;

    animationFrameRef.current = 0;
    if (
      !gesture ||
      (gesture.pendingDeltaX === 0 && gesture.pendingDeltaY === 0)
    ) {
      return;
    }

    const deltaX = gesture.pendingDeltaX;
    const deltaY = gesture.pendingDeltaY;
    gesture.pendingDeltaX = 0;
    gesture.pendingDeltaY = 0;
    writeOrbitDelta(
      gesture.interaction,
      gesture.historyGroup,
      deltaX,
      deltaY,
    );
  }, [writeOrbitDelta]);

  const schedulePendingDelta = React.useCallback((): void => {
    if (animationFrameRef.current !== 0) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(applyPendingDelta);
  }, [applyPendingDelta]);

  const stopInertia = React.useCallback((): void => {
    window.cancelAnimationFrame(inertiaAnimationFrameRef.current);
    inertiaAnimationFrameRef.current = 0;
    const inertia = inertiaRef.current;
    inertiaRef.current = null;
    inertia?.interaction.release();
  }, []);

  const startInertia = React.useCallback(
    (
      interaction: ToolcraftOrientationInteractionLease,
      historyGroup: string,
      velocityX: number,
      velocityY: number,
    ): void => {
      if (Math.hypot(velocityX, velocityY) < 0.08) {
        interaction.release();
        return;
      }

      const inertia: OrbitInertia = {
        historyGroup,
        interaction,
        lastFrameAt: performance.now(),
        velocityX,
        velocityY,
      };
      inertiaRef.current = inertia;

      const animate = (now: number): void => {
        if (inertiaRef.current !== inertia) return;
        const elapsedMs = Math.min(40, Math.max(8, now - inertia.lastFrameAt));
        inertia.lastFrameAt = now;
        const frameScale = elapsedMs / (1000 / 60);
        const committed = writeOrbitDelta(
          interaction,
          historyGroup,
          inertia.velocityX * frameScale,
          inertia.velocityY * frameScale,
        );
        if (!committed) {
          inertiaRef.current = null;
          inertiaAnimationFrameRef.current = 0;
          return;
        }

        const damping = Math.pow(0.9, frameScale);
        inertia.velocityX *= damping;
        inertia.velocityY *= damping;
        if (Math.hypot(inertia.velocityX, inertia.velocityY) < 0.02) {
          inertiaRef.current = null;
          inertiaAnimationFrameRef.current = 0;
          interaction.release();
          return;
        }
        inertiaAnimationFrameRef.current = window.requestAnimationFrame(animate);
      };

      inertiaAnimationFrameRef.current = window.requestAnimationFrame(animate);
    },
    [writeOrbitDelta],
  );

  const finishGesture = React.useCallback(
    (event: React.PointerEvent<Element>): void => {
      const gesture = gestureRef.current;

      if (!gesture || gesture.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      applyPendingDelta();
      gestureRef.current = null;
      releaseOrbitPointerCapture(gesture);

      if (
        event.type === "pointerup" &&
        Math.hypot(gesture.velocityX, gesture.velocityY) >= 0.08
      ) {
        startInertia(
          gesture.interaction,
          gesture.historyGroup,
          gesture.velocityX,
          gesture.velocityY,
        );
      } else {
        gesture.interaction.release();
      }
    },
    [applyPendingDelta, startInertia],
  );

  React.useEffect(
    () => () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      stopInertia();
      const gesture = gestureRef.current;
      gestureRef.current = null;
      gesture?.interaction.release();
      if (gesture) {
        releaseOrbitPointerCapture(gesture);
      }
    },
    [enabled, stopInertia, target],
  );

  const onPointerDown = React.useCallback<React.PointerEventHandler<Element>>(
    (event) => {
      if (
        !enabled ||
        !isUnmodifiedPrimaryPointer(event) ||
        !hitTest(event.clientX, event.clientY)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      stopInertia();
      let interaction: ToolcraftOrientationInteractionLease;
      interaction = beginToolcraftOrientationInteraction({
        onCancel: () => {
          const gesture = gestureRef.current;

          if (!gesture || gesture.interaction !== interaction) {
            if (inertiaRef.current?.interaction === interaction) {
              stopInertia();
            }
            return;
          }

          window.cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = 0;
          gestureRef.current = null;
          releaseOrbitPointerCapture(gesture);
        },
        store,
        target,
      });
      gestureRef.current = {
        element: event.currentTarget,
        historyGroup: createControlHistoryGroupId("model-orbit"),
        interaction,
        lastX: event.clientX,
        lastY: event.clientY,
        lastMoveAt: performance.now(),
        pendingDeltaX: 0,
        pendingDeltaY: 0,
        pointerId: event.pointerId,
        velocityX: 0,
        velocityY: 0,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [enabled, hitTest, stopInertia, store, target],
  );

  const onPointerMove = React.useCallback<React.PointerEventHandler<Element>>(
    (event) => {
      const gesture = gestureRef.current;

      if (!gesture || gesture.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const deltaX = event.clientX - gesture.lastX;
      const deltaY = event.clientY - gesture.lastY;
      const now = performance.now();
      const elapsedMs = Math.max(1, now - gesture.lastMoveAt);
      const frameScale = elapsedMs / (1000 / 60);
      const instantaneousVelocityX = Math.max(
        -MAX_ORBIT_VELOCITY_PER_FRAME,
        Math.min(MAX_ORBIT_VELOCITY_PER_FRAME, deltaX / frameScale),
      );
      const instantaneousVelocityY = Math.max(
        -MAX_ORBIT_VELOCITY_PER_FRAME,
        Math.min(MAX_ORBIT_VELOCITY_PER_FRAME, deltaY / frameScale),
      );
      const smoothing = 1 - Math.exp(-elapsedMs / 45);
      gesture.velocityX +=
        (instantaneousVelocityX - gesture.velocityX) * smoothing;
      gesture.velocityY +=
        (instantaneousVelocityY - gesture.velocityY) * smoothing;
      gesture.pendingDeltaX += deltaX;
      gesture.pendingDeltaY += deltaY;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      gesture.lastMoveAt = now;
      schedulePendingDelta();
    },
    [schedulePendingDelta],
  );

  return {
    onLostPointerCapture: finishGesture,
    onPointerCancel: finishGesture,
    onPointerDown,
    onPointerMove,
    onPointerUp: finishGesture,
  };
}
