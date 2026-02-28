/**
 * Validation de pose - compare la pose utilisateur à l'exercice attendu
 * MediaPipe landmarks: 11=L shoulder, 12=R shoulder, 13=L elbow, 14=R elbow,
 * 15=L wrist, 16=R wrist, 23=L hip, 24=R hip, 25=L knee, 26=R knee,
 * 27=L ankle, 28=R ankle, 0=nose
 */

function angleBetween(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return null;
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    if (len1 < 0.01 || len2 < 0.01) return null;
    const cos = Math.max(-1, Math.min(1, dot / (len1 * len2)));
    return Math.acos(cos) * (180 / Math.PI);
}

function hasGoodVisibility(landmarks, indices) {
    return indices.every(i => landmarks[i]?.visibility > 0.5);
}

export function validatePose(landmarks, exerciseId, animationPhase = 0) {
    if (!landmarks || landmarks.filter(l => l?.visibility > 0.5).length < 15) {
        return { ok: false, message: 'Placez-vous face à la caméra', score: 0 };
    }

    const lElbowAngle = angleBetween(landmarks[11], landmarks[13], landmarks[15]);
    const rElbowAngle = angleBetween(landmarks[12], landmarks[14], landmarks[16]);
    const lKneeAngle = angleBetween(landmarks[23], landmarks[25], landmarks[27]);
    const rKneeAngle = angleBetween(landmarks[24], landmarks[26], landmarks[28]);

    switch (exerciseId) {
        case 'biceps-curl': {
            if (!hasGoodVisibility(landmarks, [11, 12, 13, 14, 15, 16])) {
                return { ok: false, message: 'Montrez vos bras à la caméra', score: 0 };
            }
            const avgElbow = ((lElbowAngle ?? 90) + (rElbowAngle ?? 90)) / 2;
            if (avgElbow > 150) return { ok: true, message: 'Bien ! Bras tendus ✓', score: 100 };
            if (avgElbow < 100 && avgElbow > 50) return { ok: true, message: 'Parfait ! Coudles fléchis ✓', score: 100 };
            if (avgElbow < 50) return { ok: false, message: 'Fléchissez un peu moins les coudes', score: 60 };
            return { ok: true, message: 'Continuez le mouvement', score: 80 };
        }
        case 'arm-stretching': {
            if (!hasGoodVisibility(landmarks, [11, 12, 13, 14, 15, 16])) {
                return { ok: false, message: 'Montrez vos bras à la caméra', score: 0 };
            }
            const lArmUp = landmarks[15]?.y < landmarks[11]?.y;
            const rArmUp = landmarks[16]?.y < landmarks[12]?.y;
            if (lArmUp || rArmUp) {
                return { ok: true, message: 'Bien ! Bras au-dessus de la tête ✓', score: 100 };
            }
            return { ok: false, message: 'Levez un bras au-dessus de la tête', score: 40 };
        }
        case 'air-squat': {
            if (!hasGoodVisibility(landmarks, [23, 24, 25, 26, 27, 28])) {
                return { ok: false, message: 'Reculez pour montrer vos jambes', score: 0 };
            }
            const avgKnee = ((lKneeAngle ?? 170) + (rKneeAngle ?? 170)) / 2;
            if (avgKnee < 120 && avgKnee > 70) return { ok: true, message: 'Parfait ! Position squat ✓', score: 100 };
            if (avgKnee > 150) return { ok: true, message: 'Bien ! Position debout ✓', score: 100 };
            if (avgKnee < 70) return { ok: false, message: 'Remontez un peu', score: 60 };
            return { ok: true, message: 'Descendez en fléchissant les genoux', score: 70 };
        }
        case 'neck-stretching': {
            if (!hasGoodVisibility(landmarks, [0, 11, 12])) {
                return { ok: false, message: 'Placez votre visage face à la caméra', score: 0 };
            }
            const shoulderMidX = (landmarks[11].x + landmarks[12].x) / 2;
            const noseOffset = landmarks[0].x - shoulderMidX;
            if (Math.abs(noseOffset) > 0.08) {
                return { ok: true, message: 'Bien ! Tête inclinée ✓', score: 100 };
            }
            return { ok: false, message: 'Inclinez la tête vers l\'épaule', score: 50 };
        }
        default:
            return { ok: true, message: 'Posture détectée ✓', score: 80 };
    }
}
