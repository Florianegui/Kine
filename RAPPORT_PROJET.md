# Rapport de Projet — Kiné Rééducation
## Intégration IA/XR en Kinésithérapie (IntAI03)

**Cours :** Intégration des modèles IA — XR/AI  
**Contexte :** Bch B3 Info — Développeur Data & IA  
**Domaine :** Santé / Kinésithérapie / Rééducation  

---

## 1. Contexte et objectifs

### 1.1 Cadre du cours

Le cours IntAI03 explore l’intégration de l’IA dans les environnements XR (Extended Reality). Le projet proposé dans le PDF prévoit un pipeline **capture de mouvement → Mixamo → Blender → Unity** pour animer un personnage virtuel.

### 1.2 Choix technique : version Web

Ce projet transpose ce pipeline en **version web** (sans Unity), afin de :
- Rendre l’application accessible sans installation
- Utiliser des technologies web standard (Three.js, WebXR)
- Permettre un déploiement simple (hébergement statique)
- S’aligner sur le cas d’usage santé (Dr Cloud, visualisation 3D médicale)

### 1.3 Objectifs du projet

1. **Visualisation 3D** des exercices de rééducation
2. **Intégration IA** pour l’assistance et la personnalisation
3. **Reconnaissance vocale** pour une utilisation mains libres
4. **Suivi de progression** pour le patient
5. **Mode AR** (WebXR) pour une expérience immersive

---

## 2. Pipeline technique

### 2.1 Schéma du pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Mixamo /       │     │  Export GLB      │     │  Three.js       │
│  Blender 3D     │ ──► │  (personnage +   │ ──► │  + WebGL        │
│  (modèles)      │     │   animations)    │     │  (visualisation) │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐              │
│  Web Speech API │     │  MediaPipe Pose │              │
│  (voix → texte) │ ──► │  (analyse corps)│ ─────────────┤
└─────────────────┘     └─────────────────┘              │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  localStorage   │     │  WebXR          │     │  Interface      │
│  (suivi)        │     │  (mode AR)      │     │  utilisateur    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2.2 Outils utilisés

| Étape | Outil | Rôle |
|-------|------|------|
| Modèles 3D | Mixamo, Blender | Personnages et animations (export GLB) |
| Rendu 3D | Three.js | Visualisation WebGL, scène 3D |
| **IA posture** | MediaPipe Pose | Détection du corps en temps réel via webcam |
| Reconnaissance vocale | Web Speech API | Contrôle vocal, accessibilité |
| Réalité augmentée | WebXR | Mode AR sur mobile |
| Stockage | localStorage | Suivi des séances côté client |

### 2.3 Correspondance avec le pipeline du cours

| Cours (Unity) | Projet (Web) |
|---------------|--------------|
| Rokoko / Deepmotion / MarionetteXR | Web Speech API + keyframes procédurales |
| Mixamo | Mixamo (export GLB) + squelette procédural |
| Blender 3D | Blender (export) ou modèles prédéfinis |
| Unity | Three.js + WebXR |
| ML-Agents / Hugging Face | MediaPipe Pose |

---

## 3. Architecture de l’application

### 3.1 Structure des fichiers

```
kiné-rééduc/
├── index.html          # Point d'entrée
├── styles.css          # Styles
├── app.js              # Logique principale (3D, IA, UI)
├── exercises.js        # Données des exercices
├── poseDetection.js    # IA détection de pose
├── RAPPORT_PROJET.md   # Ce rapport
└── README.md           # Documentation technique
```

### 3.2 Modules principaux

- **Visualisation 3D** : Three.js, OrbitControls, chargement GLB
- **Animations** : keyframes procédurales ou animations GLB
- **IA** : MediaPipe Pose (détection de posture)
- **Voix** : Web Speech API (Chrome, Edge, Safari)
- **Suivi** : localStorage, statistiques, historique
- **AR** : WebXR AR (navigateurs compatibles)

---

## 4. Expérience utilisateur

### 4.1 Parcours type

1. **Accès** : ouverture de l’URL dans le navigateur
2. **Exercices** : choix dans la bibliothèque, visualisation 3D, lecture de l’animation
3. **Analyse posture** : webcam + IA, contrôle vocal
4. **Suivi** : enregistrement des séances, consultation des statistiques
5. **AR** (optionnel) : visualisation du modèle dans l’environnement réel

### 4.2 Cas d’usage santé

- **Patient** : suivi des exercices à domicile, rappel des consignes
- **Kinésithérapeute** : démonstration des mouvements, suivi à distance
- **Accessibilité** : contrôle vocal pour personnes à mobilité réduite

---

## 5. Intégration IA

### 5.1 Analyse de posture (MediaPipe Pose)

- **Détection en temps réel** : 33 points du corps via webcam
- **Exécution locale** : modèle IA dans le navigateur, sans API externe
- **Feedback visuel** : squelette superposé sur l'utilisateur

### 5.2 Reconnaissance vocale

- **Web Speech API** : transcription en temps réel
- **Commandes** : « jouer », « pause », « suivant »

### 5.3 (supprimé)

- Suggestions basées sur l’historique de suivi (à développer)
- Recommandations par zone corporelle

---

## 6. Technologies XR

### 6.1 WebXR

- Mode AR sur mobile (Android Chrome, Safari iOS)
- Placement du modèle 3D dans l’espace réel
- Interaction par écran tactile

### 6.2 Limites

- WebXR AR non supporté sur tous les navigateurs
- Performance variable selon l’appareil

---

## 7. Conclusion

Ce projet transpose le pipeline IA/XR du cours en version web, en conservant :
- une chaîne d’outils claire (Mixamo/Blender → Web → IA),
- une intégration IA réelle (MediaPipe Pose, Web Speech API),
- une dimension XR (WebXR AR),
- un cas d’usage santé (rééducation, suivi).

L’application reste évolutive (nouveaux exercices, modèles 3D, API IA alternatives) et peut servir de base pour un projet plus avancé.
