// Module 7 - Diagnosis rule engine
// Combines the leaf symptoms the user selected with the latest mock telemetry.

export type Symptom =
    | 'yellow_leaves'
    | 'brown_tips'
    | 'wilting'
    | 'leaf_spots'
    | 'curling';

// Same fields as the shared Mock Sensor JSON contract (telemetry part)
export type Telemetry = {
    soilMoisturePercent: number;
    temperatureCelsius: number;
    humidityPercent: number;
    lightLux: number;
    waterTankLevelPercent: number;
};

export type Diagnosis = {
    title: string;
    severity: 'high' | 'medium' | 'low';
    cause: string;
    steps: string[];
};

// List used by the wizard screen to draw the symptom buttons
export const SYMPTOMS: { key: Symptom; label: string }[] = [
    { key: 'yellow_leaves', label: 'Yellow leaves' },
    { key: 'brown_tips', label: 'Brown tips' },
    { key: 'wilting', label: 'Wilting' },
    { key: 'leaf_spots', label: 'Leaf spots' },
    { key: 'curling', label: 'Curling leaves' },
];

export function diagnose(symptoms: Symptom[], t: Telemetry): Diagnosis {
    const has = (s: Symptom) => symptoms.includes(s);

    // Rule 1: too much water
    if ((has('yellow_leaves') || has('wilting')) && t.soilMoisturePercent > 85) {
        return {
            title: 'Overwatering / Root Rot Risk',
            severity: 'high',
            cause: `Soil moisture is ${t.soilMoisturePercent}%, which is too high for healthy roots.`,
            steps: [
                'Stop watering for 5 to 7 days',
                'Check the roots for dark, soft parts',
                'Make sure the pot has drainage holes',
                'Turn off auto-watering for this plant',
            ],
        };
    }

    // Rule 2: too little water
    if ((has('wilting') || has('yellow_leaves')) && t.soilMoisturePercent < 30) {
        return {
            title: 'Underwatering',
            severity: 'high',
            cause: `Soil moisture is only ${t.soilMoisturePercent}%, the plant is too dry.`,
            steps: [
                'Water the plant thoroughly now',
                'Turn on the auto-watering rule',
                'Check the soil again after 24 hours',
            ],
        };
    }

    // Rule 3: heat or dry air
    if (
        (has('brown_tips') || has('curling')) &&
        (t.temperatureCelsius > 32 || t.humidityPercent < 40)
    ) {
        return {
            title: 'Heat Stress / Low Humidity',
            severity: 'medium',
            cause: `Temperature is ${t.temperatureCelsius}°C and humidity is ${t.humidityPercent}%.`,
            steps: [
                'Move the plant to a shaded spot',
                'Mist the leaves or use a humidity tray',
                'Trim the brown tips',
            ],
        };
    }

    // Rule 4: fungus
    if (has('leaf_spots') && t.humidityPercent > 80) {
        return {
            title: 'Fungal Leaf Spot',
            severity: 'medium',
            cause: `Humidity is ${t.humidityPercent}%, which helps fungus grow.`,
            steps: [
                'Remove the spotted leaves',
                'Improve air flow around the plant',
                'Water the soil, not the leaves',
            ],
        };
    }

    // Rule 5: low light
    if (has('yellow_leaves') && t.lightLux < 300) {
        return {
            title: 'Not Enough Light',
            severity: 'low',
            cause: `Light is only ${t.lightLux} lux.`,
            steps: [
                'Move the plant near a brighter window',
                'Check again after one week',
            ],
        };
    }

    // Default: nothing matched
    return {
        title: 'General Plant Stress',
        severity: 'low',
        cause: 'The symptoms do not match the current sensor readings.',
        steps: [
            'Watch the plant for 48 hours',
            'Check the light and watering schedule',
        ],
    };
}