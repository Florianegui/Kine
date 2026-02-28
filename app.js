/**
 * Kiné Rééducation - Application Web
 * Pipeline IA/XR inspiré d'IntAI03 (version web)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { exercises } from './exercises.js';
import { createPoseDetector } from './poseDetection.js';

// ============ État global ============
let scene, camera, renderer, controls;
let skeleton = null;
let persoModels = [];   // Liste des modèles GLB chargés { name, scene, mixer?, action? }
let persoModelIndex = 0;

function getPersoEntry() { return persoModels[persoModelIndex] || null; }
function getPersoModel() { return getPersoEntry()?.scene ?? null; }
function getPersoMixer() { return getPersoEntry()?.mixer ?? null; }
function getPersoAction() { return getPersoEntry()?.action ?? null; }
let currentExercise = null;
let animationPlaying = false;
let animationTime = 0;
let animationSpeed = 1;

// ============ Création du squelette 3D ============
const MODEL_STYLES = {
    perso: {
        body: { color: 0x06b6d4, shininess: 30, specular: 0x444444 },
        joint: { color: 0x0891b2, shininess: 50 }
    },
    pro: {
        body: { color: 0x94a3b8, shininess: 60, specular: 0x666666 },
        joint: { color: 0xf1f5f9, shininess: 80 }
    }
};

let modelType = 'perso';

function createSkeleton(type = modelType) {
    const group = new THREE.Group();
    const style = MODEL_STYLES[type] || MODEL_STYLES.perso;
    const material = new THREE.MeshPhongMaterial({
        color: style.body.color,
        shininess: style.body.shininess,
        specular: style.body.specular
    });
    const jointMaterial = new THREE.MeshPhongMaterial({
        color: style.joint.color,
        shininess: style.joint.shininess
    });

    const scale = 0.15;

    // Tronc (parent du cou)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * scale, 0.4 * scale, 0.8 * scale, 8), material);
    torso.position.y = 1.4 * scale;
    torso.name = 'torso';

    // Cou (enfant du tronc)
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 0.3 * scale, 8), material);
    neck.position.y = 0.4 * scale;
    neck.name = 'neck';
    torso.add(neck);

    // Tête (enfant du cou)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4 * scale, 16, 16), jointMaterial);
    head.position.y = 0.35 * scale;
    head.name = 'head';
    neck.add(head);

    // Épaules
    const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 12, 12), jointMaterial);
    lShoulder.position.set(-0.4 * scale, 1.6 * scale, 0);
    lShoulder.name = 'lShoulder';

    const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 12, 12), jointMaterial);
    rShoulder.position.set(0.4 * scale, 1.6 * scale, 0);
    rShoulder.name = 'rShoulder';

    // Bras
    const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.1 * scale, 0.5 * scale, 8), material);
    lArm.position.set(-0.55 * scale, 1.35 * scale, 0);
    lArm.rotation.z = Math.PI / 6;
    lArm.name = 'lArm';

    const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.1 * scale, 0.5 * scale, 8), material);
    rArm.position.set(0.55 * scale, 1.35 * scale, 0);
    rArm.rotation.z = -Math.PI / 6;
    rArm.name = 'rArm';

    // Hanches
    const lHip = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 12, 12), jointMaterial);
    lHip.position.set(-0.25 * scale, 1 * scale, 0);
    lHip.name = 'lHip';

    const rHip = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 12, 12), jointMaterial);
    rHip.position.set(0.25 * scale, 1 * scale, 0);
    rHip.name = 'rHip';

    // Cuisses
    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.15 * scale, 0.5 * scale, 8), material);
    lThigh.position.set(-0.25 * scale, 0.7 * scale, 0);
    lThigh.name = 'lThigh';

    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.15 * scale, 0.5 * scale, 8), material);
    rThigh.position.set(0.25 * scale, 0.7 * scale, 0);
    rThigh.name = 'rThigh';

    // Genoux (visuels)
    const lKnee = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 12, 12), jointMaterial);
    lKnee.position.set(0, -0.25 * scale, 0);
    lKnee.name = 'lKnee';
    lThigh.add(lKnee);

    const rKnee = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 12, 12), jointMaterial);
    rKnee.position.set(0, -0.25 * scale, 0);
    rKnee.name = 'rKnee';
    rThigh.add(rKnee);

    // Mollets (enfants des cuisses)
    const lCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.08 * scale, 0.45 * scale, 8), material);
    lCalf.position.set(0, -0.5 * scale, 0);
    lCalf.name = 'lCalf';
    lThigh.add(lCalf);

    const rCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.08 * scale, 0.45 * scale, 8), material);
    rCalf.position.set(0, -0.5 * scale, 0);
    rCalf.name = 'rCalf';
    rThigh.add(rCalf);

    // Assemblage (torso→neck→head, lThigh→lKnee,lCalf, rThigh→rKnee,rCalf)
    group.add(torso, lShoulder, rShoulder, lArm, rArm, lHip, rHip, lThigh, rThigh);

    // Références pour l'animation
    group.userData = {
        head, neck, torso, lShoulder, rShoulder, lArm, rArm,
        lHip, rHip, lThigh, rThigh, lKnee, rKnee, lCalf, rCalf
    };

    return group;
}

// Interpolation linéaire entre keyframes
function interpolateKeyframes(keyframes, time, loopDuration) {
    const t = time % loopDuration;
    const sorted = [...keyframes].sort((a, b) => a.t - b.t);

    if (t <= sorted[0].t) return { ...sorted[0] };
    if (t >= sorted[sorted.length - 1].t) return { ...sorted[sorted.length - 1] };

    for (let i = 0; i < sorted.length - 1; i++) {
        if (t >= sorted[i].t && t <= sorted[i + 1].t) {
            const k = (t - sorted[i].t) / (sorted[i + 1].t - sorted[i].t);
            const result = {};
            const keys = new Set([...Object.keys(sorted[i]), ...Object.keys(sorted[i + 1])]);
            keys.forEach(key => {
                if (key === 't') return;
                const v0 = sorted[i][key] ?? 0;
                const v1 = sorted[i + 1][key] ?? 0;
                result[key] = v0 + (v1 - v0) * k;
            });
            return result;
        }
    }
    return { ...sorted[0] };
}

// Appliquer la pose de base (standing / quadruped)
function applyPose(skeleton, pose) {
    const ud = skeleton.userData;
    const isQuadruped = pose === 'quadruped';

    skeleton.rotation.x = isQuadruped ? -Math.PI / 2 : 0;
    skeleton.rotation.y = 0;
    skeleton.rotation.z = 0;

    // Bras en position quadrupede (support au sol)
    const armBaseZ = isQuadruped ? Math.PI / 2.5 : Math.PI / 6;
    ud.lArm.rotation.z = armBaseZ;
    ud.rArm.rotation.z = -armBaseZ;
    if (!isQuadruped) {
        ud.lArm.rotation.x = 0;
        ud.rArm.rotation.x = 0;
    }
}

// Trouver un os dans un modèle Mixamo (par nom partiel)
function findMixamoBone(obj, ...names) {
    let found = null;
    obj.traverse((child) => {
        if (found) return;
        const n = (child.name || '').toLowerCase();
        for (const name of names) {
            if (n.includes(name.toLowerCase())) {
                found = child;
                return;
            }
        }
    });
    return found;
}

// Appliquer les keyframes à un modèle Mixamo (retargeting simplifié)
function applyKeyframeToMixamo(model, data, pose) {
    if (!model) return;
    const isQuadruped = pose === 'quadruped';
    model.rotation.x = isQuadruped ? -Math.PI / 2 : 0;
    const spine = findMixamoBone(model, 'Spine2', 'Spine1', 'Spine');
    const neck = findMixamoBone(model, 'Neck');
    const head = findMixamoBone(model, 'Head');
    const lArm = findMixamoBone(model, 'LeftUpperArm', 'LeftArm');
    const rArm = findMixamoBone(model, 'RightUpperArm', 'RightArm');
    const lThigh = findMixamoBone(model, 'LeftUpperLeg', 'LeftUpLeg');
    const rThigh = findMixamoBone(model, 'RightUpperLeg', 'RightUpLeg');
    const lCalf = findMixamoBone(model, 'LeftLowerLeg', 'LeftLeg');
    const rCalf = findMixamoBone(model, 'RightLowerLeg', 'RightLeg');
    if (data.spineX !== undefined) {
        if (spine) spine.rotation.x = data.spineX * (isQuadruped ? 0.8 : 0.5);
        if (neck) neck.rotation.x = (data.neckX ?? data.spineX) * 0.5;
        if (head) head.rotation.x = (data.headX ?? data.neckX ?? data.spineX) * 0.4;
    }
    if (data.spineY !== undefined && spine) spine.rotation.z = -data.spineY * 0.7;
    if (data.headY !== undefined && head) head.rotation.y = data.headY * 0.9;
    if (data.headZ !== undefined && head) head.rotation.z = data.headZ * 0.8;
    if (data.lArmX !== undefined && lArm && data.lWrist === undefined) {
        lArm.rotation.x = (isQuadruped ? Math.PI / 2.5 : 0) - data.lArmX * 0.8;
    }
    if (data.rArmX !== undefined && rArm && data.rWrist === undefined) {
        rArm.rotation.x = (isQuadruped ? -Math.PI / 2.5 : 0) + data.rArmX * 0.8;
    }
    if (data.lArmZ !== undefined && lArm && data.lWrist === undefined) {
        lArm.rotation.z = (isQuadruped ? Math.PI / 2.5 : Math.PI / 6) + data.lArmZ * 0.7;
    }
    if (data.rArmZ !== undefined && rArm && data.rWrist === undefined) {
        rArm.rotation.z = (isQuadruped ? -Math.PI / 2.5 : -Math.PI / 6) - data.rArmZ * 0.7;
    }
    if (data.lKnee !== undefined) {
        if (lThigh) lThigh.rotation.x = -data.lKnee * 0.5;
        if (lCalf) lCalf.rotation.x = data.lKnee * 0.55;
    }
    if (data.rKnee !== undefined) {
        if (rThigh) rThigh.rotation.x = -data.rKnee * 0.5;
        if (rCalf) rCalf.rotation.x = data.rKnee * 0.55;
    }
    if (data.lHipExt !== undefined && lThigh) lThigh.rotation.x -= data.lHipExt * 0.7;
    if (data.rHipExt !== undefined && rThigh) rThigh.rotation.x -= data.rHipExt * 0.7;
    if (data.squat !== undefined) {
        const s = data.squat * 1.2;
        if (lThigh) lThigh.rotation.x = -s * 0.8;
        if (rThigh) rThigh.rotation.x = -s * 0.8;
        if (lCalf) lCalf.rotation.x = s * 0.6;
        if (rCalf) rCalf.rotation.x = s * 0.6;
    }
    if (data.lWrist !== undefined && lArm) {
        lArm.rotation.x = -0.6;
        lArm.rotation.z = Math.PI / 6;
        lArm.rotation.y = data.lWrist * 0.8;
    }
    if (data.rWrist !== undefined && rArm) {
        rArm.rotation.x = -0.6;
        rArm.rotation.z = -Math.PI / 6;
        rArm.rotation.y = -data.rWrist * 0.8;
    }
}

// Appliquer les keyframes au squelette
function applyKeyframe(skeleton, data, pose) {
    const ud = skeleton.userData;
    const isQuadruped = pose === 'quadruped';

    // Chat-vache : flexion du dos (vache = creux, chat = rond)
    if (data.spineX !== undefined) {
        ud.torso.rotation.x = data.spineX * (isQuadruped ? 0.8 : 0.5);
        ud.neck.rotation.x = (data.neckX ?? data.spineX) * 0.5;
        ud.head.rotation.x = (data.headX ?? data.neckX ?? data.spineX) * 0.4;
    }

    // Inclinaison latérale du tronc
    if (data.spineY !== undefined) {
        ud.torso.rotation.z = -data.spineY * 0.7;
    }

    // Rotation cervicale (tête gauche/droite)
    if (data.headY !== undefined) {
        ud.head.rotation.y = data.headY * 0.9;
    }
    // Inclinaison latérale du cou (oreille vers épaule)
    if (data.headZ !== undefined) {
        ud.head.rotation.z = data.headZ * 0.8;
    }

    // Rotation des épaules (cercles) - bras à l'horizontale qui tournent
    if (data.lArmX !== undefined && data.lWrist === undefined) {
        ud.lArm.rotation.x = (isQuadruped ? Math.PI / 2.5 : 0) - data.lArmX * 0.8;
    }
    if (data.rArmX !== undefined && data.rWrist === undefined) {
        ud.rArm.rotation.x = (isQuadruped ? -Math.PI / 2.5 : 0) + data.rArmX * 0.8;
    }
    if (data.lArmZ !== undefined && data.lWrist === undefined) {
        ud.lArm.rotation.z = (isQuadruped ? Math.PI / 2.5 : Math.PI / 6) + data.lArmZ * 0.7;
    }
    if (data.rArmZ !== undefined && data.rWrist === undefined) {
        ud.rArm.rotation.z = (isQuadruped ? -Math.PI / 2.5 : -Math.PI / 6) - data.rArmZ * 0.7;
    }

    // Flexion genou (talon vers fesse)
    if (data.lKnee !== undefined) {
        ud.lThigh.rotation.x = -data.lKnee * 0.5;
        ud.lCalf.rotation.x = data.lKnee * 0.55;
    }
    if (data.rKnee !== undefined) {
        ud.rThigh.rotation.x = -data.rKnee * 0.5;
        ud.rCalf.rotation.x = data.rKnee * 0.55;
    }

    // Extension hanche (jambe vers l'arrière)
    if (data.lHipExt !== undefined) {
        ud.lThigh.rotation.x -= data.lHipExt * 0.7;
    }
    if (data.rHipExt !== undefined) {
        ud.rThigh.rotation.x -= data.rHipExt * 0.7;
    }

    // Squat (flexion genoux + hanches)
    if (data.squat !== undefined) {
        const s = data.squat * 1.2;
        ud.lThigh.rotation.x = -s * 0.8;
        ud.rThigh.rotation.x = -s * 0.8;
        ud.lCalf.rotation.x = s * 0.6;
        ud.rCalf.rotation.x = s * 0.6;
    }

    // Flexion/extension poignet - bras tendu devant, flexion au poignet
    if (data.lWrist !== undefined || data.rWrist !== undefined) {
        if (data.lWrist !== undefined) {
            ud.lArm.rotation.x = -0.6;
            ud.lArm.rotation.z = Math.PI / 6;
            ud.lArm.rotation.y = data.lWrist * 0.8;
        }
        if (data.rWrist !== undefined) {
            ud.rArm.rotation.x = -0.6;
            ud.rArm.rotation.z = -Math.PI / 6;
            ud.rArm.rotation.y = -data.rWrist * 0.8;
        }
    }
}

// ============ Initialisation Three.js ============
let gridHelper = null;
let sceneContentGroup = null;  // Groupe pour déplacer le modèle devant l'utilisateur en AR
let arMarker = null;  // Objet de test visible en AR

function initThree() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1419);

    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0.5, 0.3, 1.2);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        xrCompatible: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 3;

    // Lumières
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 3, 2);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 0.2);
    fillLight.position.set(-1, 1, -1);
    scene.add(fillLight);

    // Grille au sol (subtile)
    gridHelper = new THREE.GridHelper(2, 20, 0x334155, 0x1a2332);
    gridHelper.position.y = -0.02;
    scene.add(gridHelper);

    // Groupe pour le contenu 3D (squelette + modèles) — positionné devant l'utilisateur en AR
    sceneContentGroup = new THREE.Group();
    scene.add(sceneContentGroup);

    // Bouton AR (WebXR) — dans la barre de contrôles pour être visible sur mobile
    const arContainer = document.getElementById('arButtonContainer');
    if (arContainer) {
        const arBtn = ARButton.createButton(renderer);
        arBtn.id = 'arBtn';
        arBtn.classList.add('ar-btn');
        arBtn.title = 'Mode AR';
        arContainer.appendChild(arBtn);
    }

    // Squelette par défaut
    skeleton = createSkeleton(modelType);
    skeleton.position.y = 0.1;
    sceneContentGroup.add(skeleton);

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    renderer.setAnimationLoop(animate);
}

let wasInAR = false;

function animate() {
    const delta = 0.016;
    const inAR = renderer.xr.isPresenting;

    // Gestion entrée/sortie AR
    if (inAR && !wasInAR) {
        scene.background = null;
        if (gridHelper) gridHelper.visible = false;
        if (sceneContentGroup) {
            sceneContentGroup.position.set(0, 0.5, -0.8);   // Très proche, devant toi
            sceneContentGroup.scale.setScalar(8);            // Beaucoup plus grand
        }
        if (!arMarker) {
            arMarker = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            arMarker.position.set(0, 0.5, -0.8);
            arMarker.name = 'arMarker';
            scene.add(arMarker);
        }
        arMarker.visible = true;
        if (poseDetector?.isActive()) {
            poseDetector.stop();
            document.getElementById('poseToggle').textContent = 'Activer la caméra';
        }
    } else if (!inAR && wasInAR) {
        scene.background = new THREE.Color(0x0f1419);
        if (gridHelper) gridHelper.visible = true;
        if (sceneContentGroup) {
            sceneContentGroup.position.set(0, 0, 0);
            sceneContentGroup.scale.setScalar(1);
        }
        if (arMarker) arMarker.visible = false;
    }
    wasInAR = inAR;

    // Animations procédurales (squelette Perso/Pro) ou retargeting Mixamo
    if (animationPlaying && currentExercise && currentExercise.keyframes.length > 0) {
        const duration = currentExercise.keyframes[currentExercise.keyframes.length - 1].t;
        animationTime += delta * animationSpeed;
        if (animationTime > duration) animationTime = 0;
        const data = interpolateKeyframes(currentExercise.keyframes, animationTime, duration);
        const pm = getPersoModel();
        if (pm && modelType === 'perso' && pm.visible) {
            const mixer = getPersoMixer();
            if (mixer) {
                mixer.update(delta * animationSpeed);
            } else {
                applyKeyframeToMixamo(pm, data, currentExercise.pose || 'standing');
            }
        } else if (skeleton) {
            applyKeyframe(skeleton, data, currentExercise.pose || 'standing');
        }
    }

    // Animations GLB (Mixamo avec animation intégrée) - sync avec Play
    const pm = getPersoModel();
    const mixer = getPersoMixer();
    const action = getPersoAction();
    if (mixer && pm && pm.visible) {
        if (action) action.paused = !animationPlaying;
        if (animationPlaying) mixer.update(delta * animationSpeed);
    }

    if (!inAR) controls.update();
    renderer.render(scene, camera);
}

// ============ UI ============
const EXERCISES_LIMIT = 4;  // 4 exercices affichés, chacun avec son propre GLB

function renderExerciseList() {
    const list = document.getElementById('exerciseList');
    const limited = exercises.slice(0, EXERCISES_LIMIT);
    list.innerHTML = limited.map((ex, idx) => `
        <div class="exercise-item" data-id="${ex.id}" data-index="${idx}">
            <h4>${ex.name}</h4>
            <span>${ex.zone} • ${ex.difficulty}</span>
        </div>
    `).join('');

    list.querySelectorAll('.exercise-item').forEach(el => {
        el.addEventListener('click', () => selectExercise(el.dataset.id, parseInt(el.dataset.index, 10)));
    });
    // Sélectionner le premier exercice par défaut
    const first = limited[0];
    if (first) selectExercise(first.id, 0);
}

function selectExercise(id, exerciseIndex = 0) {
    currentExercise = exercises.find(e => e.id === id);
    if (!currentExercise) return;

    document.querySelectorAll('.exercise-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-id="${id}"]`)?.classList.add('active');

    // Chaque exercice utilise son propre GLB (index 0→exo 1, 1→exo 2, etc.)
    if (modelType === 'perso') {
        if (exerciseIndex < persoModels.length) {
            selectPersoModel(exerciseIndex);
            const sel = document.getElementById('persoModelSelect');
            if (sel) sel.value = exerciseIndex;
        }
        updateModelVisibility();
    }

    document.getElementById('exerciseTitle').textContent = currentExercise.name;
    document.getElementById('exerciseInstructions').textContent = currentExercise.instructions;
    document.getElementById('exerciseDuration').textContent = `Durée : ${currentExercise.duration}`;
    document.getElementById('exerciseDifficulty').textContent = `Difficulté : ${currentExercise.difficulty}`;
    document.getElementById('exerciseZone').textContent = `Zone : ${currentExercise.zone}`;

    animationTime = 0;
    const pm = getPersoModel();
    const mixer = getPersoMixer();
    if (pm && modelType === 'perso' && pm.visible && !mixer) {
        if (currentExercise.keyframes.length > 0) {
            applyKeyframeToMixamo(pm, currentExercise.keyframes[0], currentExercise.pose || 'standing');
        }
    } else if (skeleton) {
        applyPose(skeleton, currentExercise.pose || 'standing');
        if (currentExercise.keyframes.length > 0) {
            applyKeyframe(skeleton, currentExercise.keyframes[0], currentExercise.pose || 'standing');
        }
    }
}

function togglePlay() {
    animationPlaying = !animationPlaying;
    document.getElementById('playBtn').innerHTML = animationPlaying
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
}

function resetAnimation() {
    animationTime = 0;
    if (currentExercise) {
        const pm = getPersoModel();
        const mixer = getPersoMixer();
        if (pm && modelType === 'perso' && pm.visible && !mixer) {
            if (currentExercise.keyframes.length > 0) {
                applyKeyframeToMixamo(pm, currentExercise.keyframes[0], currentExercise.pose || 'standing');
            }
        } else if (skeleton) {
            applyPose(skeleton, currentExercise.pose || 'standing');
            if (currentExercise.keyframes.length > 0) {
                applyKeyframe(skeleton, currentExercise.keyframes[0], currentExercise.pose || 'standing');
            }
        }
    }
}

function cycleSpeed() {
    const speeds = [0.5, 1, 1.5, 2];
    const idx = speeds.indexOf(animationSpeed);
    animationSpeed = speeds[(idx + 1) % speeds.length];
    document.getElementById('speedBtn').textContent = animationSpeed + 'x';
}

// ============ Suivi ============
const STORAGE_KEY = 'kine-reeduc-sessions';

function getSessions() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveSession(exerciseId, duration = null) {
    const sessions = getSessions();
    sessions.unshift({
        exerciseId,
        date: new Date().toISOString(),
        duration: duration || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function clearSessions() {
    localStorage.removeItem(STORAGE_KEY);
}

function getStats() {
    const sessions = getSessions();
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeek = sessions.filter(s => new Date(s.date) >= startOfWeek);
    const byExercise = {};
    sessions.forEach(s => {
        byExercise[s.exerciseId] = (byExercise[s.exerciseId] || 0) + 1;
    });

    return {
        total: sessions.length,
        thisWeek: thisWeek.length,
        byExercise
    };
}

function renderSuiviView() {
    const sessions = getSessions();
    const validIds = new Set(exercises.slice(0, EXERCISES_LIMIT).map(e => e.id));
    const filteredSessions = sessions.filter(s => validIds.has(s.exerciseId));
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const thisWeek = filteredSessions.filter(s => new Date(s.date) >= startOfWeek);
    const byExercise = {};
    filteredSessions.forEach(s => {
        byExercise[s.exerciseId] = (byExercise[s.exerciseId] || 0) + 1;
    });

    document.getElementById('suiviStats').innerHTML = `
        <div class="stat-card">
            <div class="value">${filteredSessions.length}</div>
            <div class="label">Séances totales</div>
        </div>
        <div class="stat-card">
            <div class="value">${thisWeek.length}</div>
            <div class="label">Cette semaine</div>
        </div>
    `;

    const maxCount = Math.max(...Object.values(byExercise), 1);
    const limitedExos = exercises.slice(0, EXERCISES_LIMIT);
    document.getElementById('progressList').innerHTML = limitedExos.map(ex => {
        const count = byExercise[ex.id] || 0;
        const pct = Math.round((count / maxCount) * 100);
        return `
            <div class="progress-item">
                <span class="name">${ex.name}</span>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${pct}%"></div>
                </div>
                <span class="count">${count}×</span>
            </div>
        `;
    }).join('');

    document.getElementById('historyList').innerHTML = filteredSessions.length === 0
        ? '<div class="history-empty">Aucune séance enregistrée. Marquez des exercices comme effectués !</div>'
        : filteredSessions.slice(0, 20).map(s => {
            const ex = exercises.find(e => e.id === s.exerciseId);
            const date = new Date(s.date);
            const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            return `
                <div class="history-item">
                    <span class="exercise-name">${ex?.name || s.exerciseId}</span>
                    <span class="date">${dateStr}</span>
                </div>
            `;
        }).join('');
}

// ============ Chargement modèle GLB (Mixamo) ============
const gltfLoader = new GLTFLoader();

const EXO_NAMES = ['Biceps curl', 'Arm stretching', 'Air squat', 'Neck stretching'];

function loadPersoModel(files) {
    const fileList = Array.isArray(files) ? files : [files];
    fileList.forEach((file) => {
        const url = URL.createObjectURL(file);
        gltfLoader.load(url, (gltf) => {
            URL.revokeObjectURL(url);
            const sceneModel = gltf.scene;
            sceneModel.scale.setScalar(0.5);
            sceneModel.position.y = 0.1;
            sceneModel.name = 'persoModel';
            sceneContentGroup.add(sceneModel);
            const idx = persoModels.length;
            const name = idx < EXERCISES_LIMIT ? EXO_NAMES[idx] : (file.name?.replace(/\.(glb|gltf)$/i, '') || `Modèle ${idx + 1}`);
            const entry = { name, scene: sceneModel, mixer: null, action: null };
            if (gltf.animations && gltf.animations.length > 0) {
                entry.mixer = new THREE.AnimationMixer(sceneModel);
                entry.action = entry.mixer.clipAction(gltf.animations[0]);
                entry.action.setLoop(THREE.LoopRepeat);
                entry.action.play();
            }
            persoModels.push(entry);
            persoModelIndex = persoModels.length - 1;
            modelType = 'perso';
            updateModelVisibility();
            updatePersoModelSelector();
        }, undefined, (err) => {
            console.error('Erreur chargement GLB:', err);
            alert(`Erreur pour ${file.name}: vérifiez que le fichier est un GLB/GLTF valide (Mixamo).`);
        });
    });
}

function updatePersoModelSelector() {
    const sel = document.getElementById('persoModelSelect');
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = persoModels.map((m, i) =>
        `<option value="${i}">${m.name}</option>`
    ).join('');
    sel.style.display = persoModels.length > 0 ? '' : 'none';
    sel.value = Math.min(persoModelIndex, persoModels.length - 1);
    if (sel.value !== prev) selectPersoModel(parseInt(sel.value, 10));
}

function selectPersoModel(index) {
    if (index < 0 || index >= persoModels.length) return;
    persoModels.forEach((m, i) => { m.scene.visible = i === index && modelType === 'perso'; });
    persoModelIndex = index;
    updateModelVisibility();
    if (currentExercise && modelType === 'perso') {
        const pm = getPersoModel();
        const mixer = getPersoMixer();
        if (pm && !mixer && currentExercise.keyframes.length > 0) {
            applyKeyframeToMixamo(pm, currentExercise.keyframes[0], currentExercise.pose || 'standing');
        }
    }
}

function updateModelVisibility() {
    const pm = getPersoModel();
    const showPerso = pm != null;
    persoModels.forEach((m, i) => { m.scene.visible = showPerso && i === persoModelIndex; });
    if (skeleton) skeleton.visible = !showPerso;
}

function switchView(view) {
    const viewExercices = document.getElementById('viewExercices');
    const viewSuivi = document.getElementById('viewSuivi');

    viewExercices.classList.toggle('hidden', view === 'suivi');
    viewSuivi.classList.toggle('visible', view === 'suivi');

    if (view === 'suivi') {
        renderSuiviView();
        if (poseDetector?.isActive()) poseDetector.stop();
    }
}

// ============ Analyse posture ============
let poseDetector = null;

// ============ Recherche ============
function filterExercises(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.exercise-item').forEach(el => {
        const name = el.querySelector('h4').textContent.toLowerCase();
        const zone = el.querySelector('span').textContent.toLowerCase();
        el.style.display = (name.includes(q) || zone.includes(q)) ? '' : 'none';
    });
}

// ============ Init ============
document.addEventListener('DOMContentLoaded', () => {
    initThree();
    renderExerciseList();

    document.getElementById('playBtn').addEventListener('click', togglePlay);
    document.getElementById('resetBtn').addEventListener('click', resetAnimation);
    document.getElementById('speedBtn').addEventListener('click', cycleSpeed);

    document.getElementById('searchExercises').addEventListener('input', (e) => filterExercises(e.target.value));

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchView(btn.dataset.view);
        });
    });

    // Marquer comme effectué
    document.getElementById('doneBtn').addEventListener('click', () => {
        if (!currentExercise) return;
        saveSession(currentExercise.id);
        const btn = document.getElementById('doneBtn');
        btn.classList.add('done');
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Effectué !';
        setTimeout(() => {
            btn.classList.remove('done');
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Marquer comme effectué';
        }, 1500);
    });

    // Chargement modèle(s) Mixamo
    document.getElementById('modelInput').addEventListener('change', (e) => {
        const files = e.target.files;
        if (files?.length) loadPersoModel(Array.from(files));
        e.target.value = '';
    });
    document.getElementById('persoModelSelect')?.addEventListener('change', (e) => {
        selectPersoModel(parseInt(e.target.value, 10));
    });

    // Analyse posture (webcam) + validation du mouvement (uniquement quand Play)
    poseDetector = createPoseDetector(
        document.getElementById('poseVideo'),
        document.getElementById('poseCanvas'),
        document.getElementById('poseFeedback'),
        document.getElementById('posePlaceholder'),
        () => currentExercise,
        () => animationPlaying
    );
    document.getElementById('poseToggle').addEventListener('click', () => {
        if (poseDetector.isActive()) {
            poseDetector.stop();
            document.getElementById('poseToggle').textContent = 'Activer la caméra';
        } else {
            const btn = document.getElementById('poseToggle');
            btn.textContent = 'Chargement...';
            poseDetector.start().then((ok) => {
                btn.textContent = ok ? 'Arrêter la caméra' : 'Activer la caméra';
            });
        }
    });

    // Effacer historique
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        if (confirm('Effacer tout l\'historique des séances ?')) {
            clearSessions();
            renderSuiviView();
        }
    });

    // Premier exercice sélectionné
    selectExercise(exercises[0]?.id || 'biceps-curl');

    // Menu bibliothèque (ouvrir/fermer)
    const menuToggle = document.getElementById('menuToggle');
    const viewExercices = document.getElementById('viewExercices');
    if (menuToggle && viewExercices) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            viewExercices.classList.toggle('menu-closed');
        });
    }
});
