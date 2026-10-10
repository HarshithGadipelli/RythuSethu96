import fs from 'fs';
import { parseVoiceToFormMultilingual, CROPS_MAP, CATEGORIES_MAP } from './frontend/src/utils/voiceParser.js';

const res1 = parseVoiceToFormMultilingual("tomato", "en", { step: "NAME" });
console.log("tomato:", res1);

const res2 = parseVoiceToFormMultilingual("50 kg", "en", { step: "QUANTITY" });
console.log("50 kg:", res2);

const res3 = parseVoiceToFormMultilingual("40 rupees", "en", { step: "PRICE" });
console.log("40 rupees:", res3);

const res4 = parseVoiceToFormMultilingual("tomato 50 kg 40 rupees", "en", { step: "NAME" });
console.log("tomato 50 kg 40 rupees:", res4);

