# Adding Custom Notification Sound

To add a loud, attention-grabbing notification sound:

## Option 1: Use an existing sound file

If you have a sound file (like the buzzer sound from your app), copy it to:
```
android/app/src/main/res/raw/alarm.wav
```

The file must be:
- Named `alarm.wav` (lowercase, no spaces)
- In WAV, MP3, or OGG format
- Preferably under 5 seconds
- Reasonably loud but not distorted

## Option 2: Download a free notification sound

1. Download a loud notification sound from: https://pixabay.com/sound-effects/search/alarm/
2. Save it as `alarm.wav`
3. Copy to `android/app/src/main/res/raw/alarm.wav`

## After adding the sound:

1. Commit and push the changes
2. Wait for GitHub Actions to build the new APK
3. Install the new APK
4. **Uninstall the old app first** (to clear notification channel settings)
5. Install fresh and test

The notification channel settings are cached, so you MUST uninstall and reinstall for the new sound to take effect.
