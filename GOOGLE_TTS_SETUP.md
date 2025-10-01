# 🔊 Google Cloud Text-to-Speech Setup Guide

## ✅ Complete Step-by-Step Instructions

### **Step 1: Enable API in Google Cloud Console**

1. Go to: https://console.cloud.google.com/
2. Select your project (or create new)
3. Navigate to: **APIs & Services** → **Library**
4. Search: **"Cloud Text-to-Speech API"**
5. Click **ENABLE**

---

### **Step 2: Create API Key**

1. Go to: **APIs & Services** → **Credentials**
2. Click: **+ CREATE CREDENTIALS** → **API Key**
3. **Copy the API key** (save it somewhere safe!)
4. Click **RESTRICT KEY** (recommended for security):
   - Under **API restrictions**:
   - Select **Restrict key**
   - Choose **Cloud Text-to-Speech API**
   - Click **Save**

---

### **Step 3: Add API Key to Your Project**

1. **Open your `.env` file** (create if doesn't exist)
2. **Add this line:**
   ```
   VITE_GOOGLE_TTS_API_KEY=YOUR_API_KEY_HERE
   ```
3. **Replace `YOUR_API_KEY_HERE`** with your actual API key
4. **Restart your dev server:**
   ```bash
   npm run dev
   ```

---

### **Step 4: Test It Works**

1. **Open any article** in your news site
2. **Switch to Kannada/Tamil/Telugu** language
3. **Click the Play button** on Text-to-Speech
4. **Should hear high-quality Indian voice!** 🎉

---

## 🎯 Supported Languages

With Google Cloud TTS, you get **native voices** for:

| Language | Voice | Quality |
|----------|-------|---------|
| 🇮🇳 Kannada | kn-IN-Standard-A | ⭐⭐⭐⭐⭐ |
| 🇮🇳 English | en-IN-Standard-D | ⭐⭐⭐⭐⭐ |
| 🇮🇳 Tamil | ta-IN-Standard-A | ⭐⭐⭐⭐⭐ |
| 🇮🇳 Telugu | te-IN-Standard-A | ⭐⭐⭐⭐⭐ |
| 🇮🇳 Hindi | hi-IN-Standard-A | ⭐⭐⭐⭐⭐ |
| 🇮🇳 Malayalam | ml-IN-Standard-A | ⭐⭐⭐⭐⭐ |

---

## 💰 Pricing

Google Cloud TTS pricing:
- **First 1 million characters/month:** FREE ✅
- **After that:** $4 per 1 million characters

**For a news site:**
- Average article: ~500 words = ~3,000 characters
- **333 articles/month = FREE**
- Most news sites won't exceed free tier! 🎉

---

## 🔧 Files Already Created

✅ `src/api/googleTTS.js` - Google TTS service
✅ `.env.example` - Updated with TTS key
✅ Component ready to use Google TTS

---

## 📝 How It Works

1. **Checks if Google TTS is configured**
2. **If YES:** Uses Google Cloud TTS (all languages work!)
3. **If NO:** Falls back to browser TTS (English/Hindi only)

---

## 🚀 Quick Start Commands

```bash
# 1. Add your API key to .env
echo "VITE_GOOGLE_TTS_API_KEY=your_key_here" >> .env

# 2. Restart dev server
npm run dev

# 3. Test on any article!
```

---

## ⚠️ Important Notes

### **Security:**
- ✅ API key is client-side (VITE_ prefix)
- ✅ Restricted to Text-to-Speech API only
- ✅ Can add HTTP referrer restrictions for production

### **Production:**
For production, add to Netlify/Vercel environment variables:
```
VITE_GOOGLE_TTS_API_KEY=your_key_here
```

---

## 🎨 User Experience

### **Before (Browser TTS):**
- ❌ Kannada/Tamil/Telugu: "dot dot dot"
- ❌ Only English works properly
- ❌ Poor quality voices

### **After (Google TTS):**
- ✅ Perfect Kannada pronunciation
- ✅ Perfect Tamil pronunciation
- ✅ Perfect Telugu pronunciation
- ✅ High-quality natural voices
- ✅ All 6 languages supported!

---

## 🐛 Troubleshooting

### **"API key not configured" error:**
- Check `.env` file exists
- Check key starts with `VITE_`
- Restart dev server

### **"403 Forbidden" error:**
- API not enabled in Google Cloud
- API key restrictions too strict
- Check billing is enabled

### **No sound:**
- Check browser volume
- Check system volume
- Try in incognito mode

---

## 📊 Monitoring Usage

1. Go to: https://console.cloud.google.com/
2. Navigate to: **APIs & Services** → **Dashboard**
3. Click: **Cloud Text-to-Speech API**
4. View: **Quotas** and **Usage**

---

## 🎯 Next Steps

1. **Get your API key** from Google Cloud Console
2. **Add to `.env` file**
3. **Restart server**
4. **Test with Kannada article**
5. **Enjoy perfect TTS!** 🎉

---

## 💡 Alternative: Keep Browser TTS

If you don't want to use Google Cloud:
- Current implementation works for English/Hindi
- Shows helpful message for other languages
- No API costs
- Simpler setup

**Your choice!** Both options are ready to use. 🚀
