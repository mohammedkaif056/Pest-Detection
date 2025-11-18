# Testing Guide - AI Species Search

## ✅ Setup Complete

### Backend Configuration
- ✅ OpenRouter API integration configured
- ✅ Model updated to `openai/gpt-4-turbo`
- ✅ Species search endpoint: POST `/api/species/search`
- ✅ Database search with AI fallback implemented
- ✅ Backend running on port 5000

### Frontend Updates
- ✅ AI search button with Sparkles icon
- ✅ Search results show source badge (Database vs AI)
- ✅ 9 additional sample species added to display
- ✅ Species cards show taxonomy family and common crops
- ✅ Enhanced error handling and loading states

---

## 🧪 How to Test AI Species Search

### Test 1: Search for Species NOT in Database
1. Open your browser and go to the **Species** page
2. In the search box, type: **"centipedes"**
3. Click the **"AI Search"** button (with sparkles icon) OR press Enter
4. **Expected Result:**
   - Loading state appears ("Searching...")
   - AI generates 3-5 matching species results
   - Green badge appears: **"AI Results"** with sparkles icon
   - Below badge: "Generated using AI knowledge - not found in database"
   - Species cards display with full information

### Test 2: Search for Species IN Database
1. In the search box, type: **"aphid"** or **"beetle"**
2. Click **"AI Search"** button OR press Enter
3. **Expected Result:**
   - Finds results from database quickly
   - Badge shows: **"Database Results"** (gray/secondary color)
   - No AI call needed (faster response)

### Test 3: Filter AI Results by Category
1. Search for any pest with AI (e.g., "stink bug")
2. After results appear, click category filters: **All**, **Insect**, **Beetle**, etc.
3. **Expected Result:**
   - AI results can be filtered by category
   - Categories update based on available results

### Test 4: No Results Found
1. Search for something completely unrelated (e.g., "unicorn")
2. Click **"AI Search"**
3. **Expected Result:**
   - AI returns empty array or very few results
   - Message: "No species found for 'unicorn'"
   - Option to try different search query

---

## 📊 Sample Species in Database

The following species are already in the database (will return "Database Results"):

1. **Aphids (Green Peach Aphid)** - Myzus persicae
2. **Colorado Potato Beetle** - Leptinotarsa decemlineata
3. **Whitefly** - Bemisia tabaci
4. **Spider Mites** - Tetranychus urticae
5. **Armyworm** - Spodoptera frugiperda
6. **Grasshopper** - Melanoplus differentialis
7. **Leaf Miner** - Liriomyza spp.
8. **Thrips** - Frankliniella occidentalis
9. **Cutworm** - Agrotis ipsilon

Plus 9 additional sample species shown on frontend.

---

## 🔍 Example AI Search Queries

Try these searches to test AI knowledge (not in database):

- **"centipedes"** - Multi-legged arthropods
- **"stink bug"** - Shield-shaped pest
- **"japanese beetle"** - Metallic green beetle
- **"cabbage worm"** - Green caterpillar
- **"hornworm"** - Large green caterpillar
- **"flea beetle"** - Small jumping beetle
- **"scale insect"** - Stationary sap-sucking insect
- **"mealybug"** - White fuzzy pest
- **"earwig"** - Insect with pincers
- **"corn borer"** - Corn-specific pest

---

## 📝 Expected AI Response Format

When AI generates species, each result includes:

```json
{
  "name": "Japanese Beetle",
  "scientificName": "Popillia japonica",
  "category": "insect",
  "description": "Metallic green and copper beetle that feeds on plant foliage and flowers",
  "riskLevel": "high",
  "commonCrops": ["Roses", "Grapes", "Soybeans", "Corn"],
  "taxonomy": {
    "kingdom": "Animalia",
    "phylum": "Arthropoda",
    "class": "Insecta",
    "order": "Coleoptera",
    "family": "Scarabaeidae"
  }
}
```

---

## 🚨 Troubleshooting

### Issue: AI Search Returns No Results
**Possible Causes:**
- OpenRouter API key issue
- Rate limit exceeded
- Network connectivity problem

**Check:**
1. Backend terminal logs for errors
2. Browser console (F12) for network errors
3. OpenRouter account credits/status

### Issue: Search Shows "Database Results" for Unknown Species
**Cause:** Database search found a partial match

**Solution:** Use more specific search terms

### Issue: Loading Forever
**Possible Causes:**
- Backend not running
- API call timeout
- OpenRouter service down

**Fix:**
1. Check backend terminal: `npm run dev`
2. Restart backend if needed
3. Check browser network tab for 500 errors

---

## 🎯 Success Indicators

✅ **AI Search Working Correctly When:**
- Searches for non-database species return AI results
- "AI Results" badge appears with sparkles icon
- Species cards show complete information
- Taxonomy family displays correctly
- Common crops list appears
- Search responds within 2-5 seconds
- Backend logs show: `[SPECIES-SEARCH] No database results, using AI for: "query"`

---

## 💡 Tips

- **Faster Searches:** Try database species first (Aphids, Beetles, etc.)
- **Better AI Results:** Use common pest names rather than scientific names
- **Category Filtering:** Works with both database and AI results
- **Multiple Searches:** AI results persist until new search or page refresh

---

## 📞 Backend Logs to Watch

When testing, monitor backend terminal for these logs:

```
[SPECIES-SEARCH] Searching for: "centipedes"
[SPECIES-SEARCH] No database results, using AI for: "centipedes"
[SPECIES-SEARCH] AI generated 3 results
```

Success! AI search is working when you see these logs and results appear in browser.

---

**Last Updated:** 2025-11-17 17:58
**Backend Status:** ✅ Running on port 5000
**OpenRouter:** ✅ Configured with gpt-4-turbo
