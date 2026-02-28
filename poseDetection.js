/**
 * Détection de pose en temps réel - MediaPipe Pose
 * IA de reconnaissance corporelle (sans API, local)
 */

import { validatePose } from './poseValidator.js';

const POSE_CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [24, 26], [26, 28],
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    [9, 10]
];

export function createPoseDetector(videoEl, canvasEl, feedbackEl, placeholderEl, getCurrentExercise = () => null, getIsPlaying = () => false) {
    let pose = null;
    let isActive = false;
    let rafId = null;

    const ctx = canvasEl.getContext('2d');

    function drawPose(results) {
        if (!results.poseLandmarks) return;
        const landmarks = results.poseLandmarks;
        const width = canvasEl.width;
        const height = canvasEl.height;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(videoEl, 0, 0, width, height);

        const exercise = getCurrentExercise();
        const isPlaying = getIsPlaying();
        const hasValidation = exercise?.id && isPlaying;
        const result = hasValidation && validatePose(landmarks, exercise.id);
        const isOk = result?.ok;
        ctx.strokeStyle = hasValidation ? (isOk ? '#10b981' : '#f59e0b') : '#06b6d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (const [i, j] of POSE_CONNECTIONS) {
            if (landmarks[i]?.visibility > 0.5 && landmarks[j]?.visibility > 0.5) {
                ctx.moveTo(landmarks[i].x * width, landmarks[i].y * height);
                ctx.lineTo(landmarks[j].x * width, landmarks[j].y * height);
            }
        }
        ctx.stroke();

        ctx.fillStyle = hasValidation ? (isOk ? '#10b981' : '#f59e0b') : '#06b6d4';
        for (const lm of landmarks) {
            if (lm.visibility > 0.5) {
                ctx.beginPath();
                ctx.arc(lm.x * width, lm.y * height, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function getFeedback(landmarks) {
        if (!landmarks) return 'Détection en cours...';
        const visibility = landmarks.filter(l => l?.visibility > 0.5).length;
        if (visibility < 10) return 'Reculez ou placez-vous face à la caméra';
        const exercise = getCurrentExercise();
        const isPlaying = getIsPlaying();
        if (exercise?.id && isPlaying) {
            const result = validatePose(landmarks, exercise.id);
            return result.ok ? `✓ ${result.message}` : `⚠ ${result.message}`;
        }
        if (!exercise?.id) return 'Cliquez sur un exercice dans la liste à gauche';
        if (visibility > 25) return 'Cliquez sur Play ▶ pour démarrer, l\'analyse suivra';
        return 'Bonne détection en cours...';
    }

    async function processFrame() {
        if (!pose || !isActive || videoEl.readyState < 2) return;
        try {
            await pose.send({ image: videoEl });
        } catch (e) {
            console.warn('Pose send error:', e);
        }
        rafId = requestAnimationFrame(processFrame);
    }

    async function startCamera() {
        try {
            if (placeholderEl) placeholderEl.classList.add('hidden');
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
            videoEl.srcObject = stream;
            await new Promise((resolve) => { videoEl.onloadedmetadata = resolve; });
            await videoEl.play();
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
            videoEl.classList.add('active');
            return true;
        } catch (e) {
            if (placeholderEl) placeholderEl.classList.remove('hidden');
            feedbackEl.textContent = 'Erreur : ' + (e.message || 'Accès refusé');
            return false;
        }
    }

    function stopCamera() {
        if (videoEl.srcObject) {
            videoEl.srcObject.getTracks().forEach(t => t.stop());
            videoEl.srcObject = null;
        }
        videoEl.classList.remove('active');
        if (placeholderEl) placeholderEl.classList.remove('hidden');
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        feedbackEl.textContent = '';
    }

    return {
        async start() {
            if (isActive) return true;
            feedbackEl.textContent = 'Activation de la caméra...';
            const ok = await startCamera();
            if (!ok) return false;
            isActive = true;
            if (typeof Pose === 'undefined') {
                if (placeholderEl) placeholderEl.classList.remove('hidden');
                feedbackEl.textContent = 'MediaPipe non chargé. Rechargez la page.';
                return false;
            }
            feedbackEl.textContent = 'Chargement du modèle IA...';
            pose = new Pose({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
            });
            pose.setOptions({
                modelComplexity: 0,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            pose.onResults((results) => {
                drawPose(results);
                const msg = getFeedback(results.poseLandmarks);
                feedbackEl.textContent = msg || 'Posture détectée';
                feedbackEl.style.display = 'block';
            });
            feedbackEl.textContent = 'Analyse en cours...';
            feedbackEl.style.display = 'block';
            processFrame();
            return true;
        },
        stop() {
            isActive = false;
            stopCamera();
        },
        isActive: () => isActive
    };
}
