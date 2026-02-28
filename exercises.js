/**
 * Bibliothèque d'exercices de kinésithérapie
 * pose: 'standing' | 'quadruped' - position de base du corps
 * Angles en radians approximatifs pour des mouvements réalistes
 */

export const exercises = [
    {
        id: 'biceps-curl',
        name: 'Biceps Curl',
        zone: 'Bras',
        difficulty: 'Facile',
        duration: '2 min',
        pose: 'standing',
        instructions: 'Debout, bras le long du corps. Fléchissez les coudes pour amener les mains vers les épaules, puis redescendez lentement. Gardez les coudes fixes. 12 répétitions.',
        keyframes: [
            { t: 0, lArmX: 0, rArmX: 0, lArmZ: -1.5, rArmZ: -1.5 },
            { t: 0.8, lArmX: 1, rArmX: 1, lArmZ: -1.5, rArmZ: -1.5 },
            { t: 1.6, lArmX: 1, rArmX: 1, lArmZ: -1.5, rArmZ: -1.5 },
            { t: 2.4, lArmX: 0, rArmX: 0, lArmZ: -1.5, rArmZ: -1.5 },
            { t: 3.2, lArmX: 0, rArmX: 0, lArmZ: -1.5, rArmZ: -1.5 }
        ]
    },
    {
        id: 'arm-stretching',
        name: 'Arm Stretching',
        zone: 'Épaules / Bras',
        difficulty: 'Facile',
        duration: '2 min',
        pose: 'standing',
        instructions: 'Debout, levez un bras au-dessus de la tête et pliez le coude. Avec l\'autre main, tirez doucement le coude vers l\'arrière. Maintenez 20 secondes. Changez de côté.',
        keyframes: [
            { t: 0, lArmX: 0.5, rArmX: 0.5, lArmZ: 0.9, rArmZ: 0.9 },
            { t: 1, lArmX: -0.3, rArmX: 0.5, lArmZ: 1.8, rArmZ: 0.9 },
            { t: 3, lArmX: -0.3, rArmX: 0.5, lArmZ: 1.8, rArmZ: 0.9 },
            { t: 4, lArmX: 0.5, rArmX: 0.5, lArmZ: 0.9, rArmZ: 0.9 },
            { t: 5, lArmX: 0.5, rArmX: -0.3, lArmZ: 0.9, rArmZ: 1.8 },
            { t: 7, lArmX: 0.5, rArmX: -0.3, lArmZ: 0.9, rArmZ: 1.8 },
            { t: 8, lArmX: 0.5, rArmX: 0.5, lArmZ: 0.9, rArmZ: 0.9 }
        ]
    },
    {
        id: 'air-squat',
        name: 'Air Squat',
        zone: 'Jambes',
        difficulty: 'Moyen',
        duration: '2 min',
        pose: 'standing',
        instructions: 'Pieds à largeur d\'épaules. Descendez en fléchissant les genoux et les hanches comme pour s\'asseoir. Gardez le dos droit. Remontez en poussant sur les talons. 10 répétitions.',
        keyframes: [
            { t: 0, squat: 0 },
            { t: 1, squat: 1 },
            { t: 2, squat: 1 },
            { t: 3, squat: 0 },
            { t: 4, squat: 0 }
        ]
    },
    {
        id: 'neck-stretching',
        name: 'Neck Stretching',
        zone: 'Cou',
        difficulty: 'Facile',
        duration: '1 min',
        pose: 'standing',
        instructions: 'Assis ou debout, dos droit. Inclinez la tête sur le côté vers l\'épaule. Maintenez 10 secondes. Revenez au centre. Répétez de l\'autre côté. 3 fois chaque côté.',
        keyframes: [
            { t: 0, headZ: 0 },
            { t: 0.5, headZ: 0.9 },
            { t: 2, headZ: 0.9 },
            { t: 2.5, headZ: 0 },
            { t: 3, headZ: -0.9 },
            { t: 4.5, headZ: -0.9 },
            { t: 5, headZ: 0 }
        ]
    },
    {
        id: 'extension-hanche',
        name: 'Extension de hanche',
        zone: 'Hanches',
        difficulty: 'Moyen',
        duration: '2 min',
        pose: 'standing',
        instructions: 'Debout, tenez-vous à un support. Étendez une jambe vers l\'arrière en gardant le genou droit. Maintenez 15 secondes. Répétez 5 fois par jambe.',
        keyframes: [
            { t: 0, lHipExt: 0, rHipExt: 0 },
            { t: 1, lHipExt: 0.8, rHipExt: 0 },
            { t: 2.5, lHipExt: 0.8, rHipExt: 0 },
            { t: 3.5, lHipExt: 0, rHipExt: 0 },
            { t: 4.5, lHipExt: 0, rHipExt: 0.8 },
            { t: 6, lHipExt: 0, rHipExt: 0.8 },
            { t: 7, lHipExt: 0, rHipExt: 0 }
        ]
    },
    {
        id: 'rotation-cervicale',
        name: 'Rotation cervicale',
        zone: 'Cou',
        difficulty: 'Facile',
        duration: '1 min',
        pose: 'standing',
        instructions: 'Assis, dos droit. Tournez lentement la tête vers la droite jusqu\'à sentir une légère tension. Maintenez 5 secondes. Revenez au centre. Répétez à gauche. 5 fois chaque côté.',
        keyframes: [
            { t: 0, headY: 0 },
            { t: 0.5, headY: 0.8 },
            { t: 1.5, headY: 0.8 },
            { t: 2, headY: 0 },
            { t: 2.5, headY: -0.8 },
            { t: 3.5, headY: -0.8 },
            { t: 4, headY: 0 }
        ]
    },
    {
        id: 'squat-mur',
        name: 'Squat contre le mur',
        zone: 'Jambes',
        difficulty: 'Moyen',
        duration: '2 min',
        pose: 'standing',
        instructions: 'Dos contre un mur, pieds à largeur d\'épaules. Glissez le long du mur en fléchissant les genoux (max 90°). Maintenez 20 secondes. Remontez lentement. 5 répétitions.',
        keyframes: [
            { t: 0, squat: 0 },
            { t: 1, squat: 1 },
            { t: 2.5, squat: 1 },
            { t: 3.5, squat: 0 }
        ]
    },
    {
        id: 'poignet-flexion',
        name: 'Flexion/Extension poignets',
        zone: 'Poignets',
        difficulty: 'Facile',
        duration: '1 min',
        pose: 'standing',
        instructions: 'Tendez le bras devant vous, paume vers le bas. Avec l\'autre main, tirez doucement les doigts vers vous puis poussez vers le bas. 10 répétitions par main.',
        keyframes: [
            { t: 0, lWrist: 0, rWrist: 0 },
            { t: 0.5, lWrist: 0.8, rWrist: 0 },
            { t: 1, lWrist: -0.6, rWrist: 0 },
            { t: 1.5, lWrist: 0, rWrist: 0 },
            { t: 2, lWrist: 0, rWrist: 0.8 },
            { t: 2.5, lWrist: 0, rWrist: -0.6 },
            { t: 3, lWrist: 0, rWrist: 0 }
        ]
    }
];
