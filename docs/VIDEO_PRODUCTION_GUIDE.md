# Video Production Guide

This guide provides instructions for creating high-quality video walkthroughs for the Care Commons showcase.

## Overview

Video walkthroughs are 5-10 minute screen recordings that demonstrate key workflows in the Care Commons platform. Each video should:

- Focus on a specific vertical (e.g., Client Demographics, Care Plans, EVV)
- Target a specific role (Administrator, Care Coordinator, Caregiver, Patient/Family)
- Follow a clear narrative structure
- Include narration explaining each step
- Show realistic data and scenarios

## Required Videos

Based on the task requirements, create the following videos:

### 1. Client Demographics Management (8 min)
**Role:** Administrator
**Topics to Cover:**
- Adding a new client with complete demographics
- Uploading required documentation
- Setting up family contacts
- Configuring billing preferences
- Managing client status changes

### 2. Creating and Managing Care Plans (10 min)
**Role:** Care Coordinator
**Topics to Cover:**
- Creating a new care plan
- Adding care tasks with schedules
- Assigning tasks to specific caregivers
- Setting up recurring task patterns
- Monitoring task completion

### 3. Mobile EVV: Clock In and Out (7 min)
**Role:** Caregiver
**Topics to Cover:**
- Opening the mobile app
- Viewing assigned visits
- Clocking in with GPS verification
- Completing care tasks
- Adding visit notes
- Clocking out and submitting visit

### 4. Billing and Invoicing (12 min)
**Role:** Administrator
**Topics to Cover:**
- Generating invoices from completed visits
- Reviewing billable hours
- Applying rates and modifiers
- Submitting claims to payors
- Tracking payment status
- Managing outstanding balances

### 5. Payroll Processing (9 min)
**Role:** Administrator
**Topics to Cover:**
- Creating a new pay period
- Reviewing caregiver timesheets
- Approving hours worked
- Calculating overtime and bonuses
- Generating payroll reports
- Exporting to payroll systems

### 6. Shift Matching and Scheduling (8 min)
**Role:** Care Coordinator
**Topics to Cover:**
- Viewing open shifts
- Reviewing caregiver availability
- Matching caregivers to shifts
- Handling scheduling conflicts
- Sending shift notifications
- Managing shift swaps

### 7. Family Portal Overview (6 min)
**Role:** Patient/Family
**Topics to Cover:**
- Logging into the family portal
- Viewing care plan and schedule
- Checking visit history
- Communicating with care team
- Reviewing care notes
- Providing feedback

## Production Requirements

### Equipment
- **Screen Recording Software:**
  - OBS Studio (free, open source) - Recommended
  - Camtasia (paid, professional)
  - ScreenFlow (Mac only)
  - Loom (web-based, simple)

- **Microphone:**
  - USB condenser mic (Blue Yeti, Audio-Technica AT2020USB+)
  - Or built-in laptop mic in a quiet environment

- **Video Editing:**
  - DaVinci Resolve (free)
  - Adobe Premiere Pro (paid)
  - iMovie (Mac, free)

### Recording Settings
- **Resolution:** 1920x1080 (1080p)
- **Frame Rate:** 30 fps minimum (60 fps preferred)
- **Audio:** 48 kHz, stereo
- **Format:** MP4 (H.264 codec)
- **Bitrate:** 5-10 Mbps for high quality

### Browser Setup
- Use Chrome or Firefox in incognito/private mode
- Zoom level: 100% (or 90% for more content visibility)
- Hide browser bookmarks bar
- Close unnecessary tabs
- Disable browser extensions that add UI elements

## Recording Process

### Pre-Production
1. **Write a script** - Outline exactly what you'll say and do
2. **Prepare demo data** - Use realistic names, dates, and scenarios
3. **Test the workflow** - Run through the entire process before recording
4. **Set up your environment:**
   - Close other applications
   - Disable notifications (Do Not Disturb mode)
   - Set browser to full screen or hide non-essential UI
   - Position cursor at starting location

### Recording
1. **Start recording** with your screen capture software
2. **Wait 3 seconds** before speaking (easier to edit later)
3. **Speak clearly and slowly:**
   - Explain what you're doing as you do it
   - Pause briefly between major steps
   - Use a conversational, friendly tone
4. **Move mouse deliberately:**
   - Don't rush cursor movements
   - Pause cursor over important elements
   - Circle or wiggle cursor to draw attention
5. **If you make a mistake:**
   - Pause for 3 seconds
   - Resume from a logical point
   - You can edit out mistakes later

### Post-Production
1. **Trim intro/outro** - Remove dead space at beginning and end
2. **Remove mistakes** - Cut out errors and long pauses
3. **Add callouts:**
   - Highlight important UI elements
   - Add text overlays for key points
   - Use arrows or circles to direct attention
4. **Add intro/outro slides:**
   - Intro: Video title, role, estimated time
   - Outro: "Thank you for watching" + link to docs
5. **Add captions/subtitles** (highly recommended for accessibility)
6. **Export final video:**
   - Format: MP4 (H.264)
   - Resolution: 1920x1080
   - Frame rate: Match recording (30 or 60 fps)
   - Bitrate: 5-10 Mbps

## Script Template

```
[INTRO - 10 seconds]
"Hi! I'm [Name/Role], and in this video, I'll show you how to [task].
This tutorial is designed for [role] and will take about [X] minutes.
Let's get started!"

[MAIN CONTENT - Varies by video]
"First, we'll [step 1]..."
"Notice how [important detail]..."
"Now, let's [step 2]..."

[OUTRO - 10 seconds]
"That's it! You now know how to [task].
For more tutorials, visit our documentation at docs.care-commons.org.
Thanks for watching!"
```

## Realistic Demo Data

Use realistic but clearly fictional data:

### Names
- Use diverse, realistic names from name generators
- Avoid celebrity names or anything too generic
- Examples: Margaret Thompson, Emily Rodriguez, Sarah Kim

### Addresses
- Use real street names but fictional numbers
- Example: "1234 Maple Street, Austin, TX 78701"

### Dates
- Use dates within the last 30 days for recent activity
- Use realistic schedules (e.g., visits during daytime hours)

### Scenarios
- Base scenarios on real-world care situations
- Examples:
  - Post-surgery recovery care
  - Long-term assistance for seniors
  - Respite care for family caregivers
  - Complex medication management

## Storage and Hosting

### File Organization
```
/videos/
  ├── source/                    # Original recordings (keep these!)
  │   ├── client-demographics-admin.mov
  │   ├── care-plans-coordinator.mov
  │   └── ...
  ├── edited/                    # Final edited versions
  │   ├── client-demographics-admin.mp4
  │   ├── care-plans-coordinator.mp4
  │   └── ...
  ├── thumbnails/               # Video thumbnail images
  │   ├── client-demographics.jpg
  │   ├── care-plans.jpg
  │   └── ...
  └── captions/                 # SRT or VTT caption files
      ├── client-demographics-admin.vtt
      ├── care-plans-coordinator.vtt
      └── ...
```

### Hosting Options

#### Option 1: GitHub Repository (Free, Limited)
- Store small videos (< 100 MB) in the repository
- Use Git LFS for larger files
- Limitations: File size, bandwidth

#### Option 2: YouTube (Recommended)
- Create a "Care Commons Tutorials" channel
- Upload videos as unlisted or public
- Embed videos in the showcase
- Benefits: Free, unlimited bandwidth, built-in player

#### Option 3: Vimeo (Professional)
- Better player customization
- No ads
- More control over branding
- Costs money for high-quality hosting

#### Option 4: Self-Hosted CDN
- AWS S3 + CloudFront
- Cloudflare R2
- Full control, pay for bandwidth

## Adding Videos to the Showcase

Once videos are recorded and hosted:

1. **Upload videos** to your chosen hosting platform
2. **Update video URLs** in `VideoWalkthroughsPage.tsx`:
   ```typescript
   const videoWalkthroughs: VideoWalkthrough[] = [
     {
       id: 'client-demographics-admin',
       title: 'Client Demographics Management',
       videoSrc: 'https://your-cdn.com/videos/client-demographics-admin.mp4',
       thumbnail: 'https://your-cdn.com/thumbnails/client-demographics.jpg',
       // ... other properties
     },
     // ... more videos
   ];
   ```
3. **Test playback** in the showcase
4. **Add captions** if available

## Accessibility Requirements

- **Captions:** All videos must have captions (auto-generated is acceptable, manual is better)
- **Transcripts:** Provide text transcripts for each video
- **Audio descriptions:** For critical visual information, describe it verbally
- **Keyboard controls:** Ensure video player works with keyboard only

## Quality Checklist

Before publishing a video, verify:

- [ ] Audio is clear with no background noise
- [ ] Resolution is 1080p
- [ ] No personal information visible (real emails, phone numbers, etc.)
- [ ] Cursor movements are smooth and deliberate
- [ ] All steps are explained clearly
- [ ] Video length is within target range
- [ ] Intro and outro are present
- [ ] Captions/subtitles are accurate
- [ ] Thumbnail is engaging and clear
- [ ] Video plays correctly in the showcase

## Example Recording Flow

Here's a detailed example for the "Mobile EVV" video:

### Script
```
[0:00-0:10] INTRO
"Hi! I'm Maria, a caregiver with Care Commons. In this 7-minute video,
I'll show you how to use the mobile app for electronic visit verification."

[0:10-1:00] LOGIN
"Let's start by opening the Care Commons mobile app. I'll log in with
my caregiver credentials. Notice the fingerprint authentication option
for faster logins on subsequent visits."

[1:00-2:00] VIEW SCHEDULE
"Here's my schedule for today. I can see all my assigned visits, including
client names, addresses, and scheduled times. My next visit is with
Margaret Thompson at 2:00 PM for personal care assistance."

[2:00-3:30] CLOCK IN
"I've arrived at Margaret's home. To clock in, I tap 'Start Visit'.
The app checks my GPS location to verify I'm within the geofence radius.
See the green circle? That means I'm in the right place. Now I'll
complete the required attestations..."

[Continues through all steps...]

[6:40-7:00] OUTRO
"That's how simple it is to use the Care Commons mobile app for EVV!
For more tutorials, visit docs.care-commons.org. Thanks for watching!"
```

### Timeline
- 0:00-0:10: Intro slide with title
- 0:10-1:00: App login and authentication
- 1:00-2:00: Schedule overview
- 2:00-3:30: Clock in process with GPS
- 3:30-5:00: Completing tasks during visit
- 5:00-6:00: Adding visit notes
- 6:00-6:40: Clock out and submission
- 6:40-7:00: Outro slide

## Support and Resources

- **OBS Studio Tutorial:** https://obsproject.com/wiki/
- **Davinci Resolve Tutorial:** https://www.blackmagicdesign.com/products/davinciresolve/training
- **Accessibility Guidelines:** https://www.w3.org/WAI/media/av/
- **Free Stock Music:** https://incompetech.com/ (for intro/outro music if desired)

## Questions?

For questions about video production for Care Commons:
- Open an issue on GitHub
- Contact the project maintainers
- Check the documentation at docs.care-commons.org

---

**Happy Recording!** 🎥
