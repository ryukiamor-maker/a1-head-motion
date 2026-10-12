export type HeadTrackingPose = { yaw: number; pitch: number; roll: number };

const DEG = 180 / Math.PI;

export function poseFromCameraMatrix(data: ArrayLike<number>): HeadTrackingPose {
  const r00 = data[0] ?? 1;
  const r10 = data[1] ?? 0;
  const r20 = data[2] ?? 0;
  const r21 = data[6] ?? 0;
  const r22 = data[10] ?? 1;
  return {
    yaw: Math.atan2(r20, r00) * DEG,
    pitch: Math.atan2(-r21, r22) * DEG,
    // Detection sees the raw frame; the camera preview is mirrored in CSS.
    // Match its visible tilt in every model, readout and recorded keyframe.
    roll: -Math.atan2(r10, r00) * DEG,
  };
}
