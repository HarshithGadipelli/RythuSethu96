import { parseVoiceToFormMultilingual } from './frontend/src/utils/voiceParser.js';
console.log("Testing Tomato in step NAME");
console.log(parseVoiceToFormMultilingual("Tomato", "en", {step: "NAME"}));
console.log("Testing 50 in step QUANTITY");
console.log(parseVoiceToFormMultilingual("50", "en", {step: "QUANTITY"}));
