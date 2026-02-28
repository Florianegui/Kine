# Kiné Rééducation — Plateforme Web IA/XR

Application web professionnelle de kinésithérapie, inspirée du cours **IntAI03** (Intégration des modèles IA en XR). Version web sans Unity.

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Visualisation 3D** | Squelette animé + chargement de modèles Mixamo (GLB) |
| **Analyse posture IA** | MediaPipe Pose — détection du corps en temps réel via webcam (écran dédié) |
| **Suivi** | Progression, historique, statistiques (localStorage) |
| **Mode AR** | WebXR — visualisation en réalité augmentée (mobile) |

## Installation

```bash
# Cloner ou télécharger le projet
cd kiné-rééduc

# Lancer un serveur HTTP (requis pour les modules ES)
python -m http.server 8080
# ou
npx serve .
```

Ouvrir http://localhost:8080

## Configuration

### Modèles 3D (Mixamo)

1. Télécharger un personnage sur [mixamo.com](https://www.mixamo.com) (gratuit, compte Adobe)
2. Exporter en **GLB**
3. Cliquer sur « Modèle » dans la barre d'outils 3D
4. Sélectionner le fichier

## Pipeline technique

```
Mixamo/Blender → Export GLB → Three.js (WebGL)
MediaPipe Pose → Webcam → Détection posture (IA locale)
localStorage → Suivi des séances
WebXR → Mode AR
```

Voir **RAPPORT_PROJET.md** pour la documentation complète.

## Structure

```
├── index.html
├── app.js          # Logique principale
├── exercises.js    # Données exercices
├── poseDetection.js # IA détection de pose (MediaPipe)
├── styles.css
├── RAPPORT_PROJET.md
└── README.md
```

## Technologies

- **Three.js** — Rendu 3D, GLTFLoader
- **MediaPipe Pose** — IA de détection de posture (sans API)
- **WebXR** — Réalité augmentée

## Licence

Projet pédagogique — IntAI03
