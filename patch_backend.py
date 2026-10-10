import os

file_path = r"c:\Users\Harshith Gadipelli\Documents\Projectlu\RythuJanaSethu\backend\routes\aiRoutes.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_prompt = """const prompt = `You are an omnipresent agricultural assistant parsing voice input from farmers in "${lang || "en"}".
The farmer is currently at the "${step}" step of the form, but they might provide a full sentence.
The farmer said: "${transcript}".

Extract as much information as you can from this sentence:
1. "name": The standard English crop/produce name (e.g. Tomato, Potato, Rice, Wheat, Exotic Dragon Fruit).
2. "quantity": The numerical quantity (e.g. 50).
3. "unit": The unit (e.g. "kg", "quintal", "bag", "tonne", "litre", "piece", "dozen").
4. "price": The price in Rupees if mentioned.

Reply strictly in JSON format (e.g. { "name": "Tomato", "quantity": 50, "unit": "kg", "price": 40 }). Omit keys if the user didn't mention them. Do not include markdown backticks or extra commentary.`;"""

new_prompt = """const prompt = `You are an omnipresent agricultural assistant parsing voice input from farmers in "${lang || "en"}".
The farmer is currently at the "${step}" step of the form, but they might provide a full sentence, or use local dialects/slang.
The farmer said: "${transcript}".

Extract as much information as you can from this sentence, even if it's in local slang or mixed language.
If the user is correcting a previous mistake (e.g. "no, not 50, it is 40", or "change the price to 30"), extract the NEW corrected value.
Fields to extract:
1. "name": The standard English crop/produce name (e.g. Tomato, Potato, Rice, Wheat).
2. "quantity": The numerical quantity (e.g. 50).
3. "unit": The unit (e.g. "kg", "quintal", "bag", "tonne", "litre", "piece", "dozen").
4. "price": The price in Rupees if mentioned.
5. "location": The city, village or GPS location if mentioned.
6. "description": Any other descriptive words.

Reply strictly in JSON format (e.g. { "name": "Tomato", "quantity": 50, "unit": "kg", "price": 40, "location": "Hyderabad", "description": "Fresh" }). Omit keys if the user didn't mention them. Do not include markdown backticks or extra commentary.`;"""

content = content.replace(old_prompt, new_prompt)

old_fallback = """    if (step === "NAME") return res.json({ name: transcript.trim() });
    if (step === "QUANTITY") return res.json({ quantity: extractedNum || 10, unit: foundUnit });
    if (step === "PRICE") return res.json({ price: extractedNum || 30 });
  } catch (err) {"""

new_fallback = """    if (step === "NAME") return res.json({ name: transcript.trim() });
    if (step === "QUANTITY") return res.json({ quantity: extractedNum || 10, unit: foundUnit });
    if (step === "PRICE") return res.json({ price: extractedNum || 30 });
    if (step === "LOCATION") return res.json({ location: transcript.trim() });
    if (step === "DESCRIPTION") return res.json({ description: transcript.trim() });
  } catch (err) {"""

content = content.replace(old_fallback, new_fallback)

old_catch = """    if (step === "NAME") {
      res.json({ name: transcript ? transcript.trim() : "Farm Produce" });
    } else if (step === "QUANTITY") {
      res.json({ quantity: extractedNum || 50, unit: foundUnit });
    } else if (step === "PRICE") {
      res.json({ price: extractedNum || 40 });
    } else {
      res.json({});
    }"""

new_catch = """    if (step === "NAME") {
      res.json({ name: transcript ? transcript.trim() : "Farm Produce" });
    } else if (step === "QUANTITY") {
      res.json({ quantity: extractedNum || 50, unit: foundUnit });
    } else if (step === "PRICE") {
      res.json({ price: extractedNum || 40 });
    } else if (step === "LOCATION") {
      res.json({ location: transcript ? transcript.trim() : "" });
    } else if (step === "DESCRIPTION") {
      res.json({ description: transcript ? transcript.trim() : "" });
    } else {
      res.json({});
    }"""
    
content = content.replace(old_catch, new_catch)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated aiRoutes.js")
