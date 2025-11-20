# Mobile App Showcase Integration

## Overview

The Care Commons mobile app is now integrated into both the **Showcase** and **Web Demo** environments, allowing users to interact with the actual React Native mobile app running in their browser.

## Architecture

### Components

1. **MobileSimulator Component** (`@care-commons/shared-components`)
   - Reusable phone frame simulator
   - Embeds mobile app via iframe
   - Handles loading/error states
   - Provides device chrome (status bar, home indicator)

2. **Mobile App Web Support** (`packages/mobile`)
   - Expo Web enables React Native to run in browser
   - Same codebase for iOS, Android, and Web
   - All mobile features available in browser (except native APIs)

3. **Showcase Integration** (`showcase/src/pages/MobileDemoPage.tsx`)
   - Dedicated mobile demo page
   - Feature highlights and tech stack info
   - Live mobile simulator
   - Connection settings

4. **Landing Page Preview** (`showcase/src/pages/LandingPage.tsx`)
   - Mobile app teaser section
   - Direct link to full mobile demo

## Running Locally

### Start All Services

```bash
# Terminal 1 - Mobile app web server
cd packages/mobile
npm run web
# Runs on http://localhost:8081

# Terminal 2 - Showcase
cd showcase
npm run dev
# Runs on http://localhost:5173

# Terminal 3 - Web demo (optional)
cd packages/web
npm run dev
# Runs on http://localhost:5174
```

### Access Points

- **Showcase Mobile Demo**: http://localhost:5173/care-commons/mobile
- **Showcase Landing**: http://localhost:5173/care-commons/ (scroll to mobile section)
- **Mobile App Direct**: http://localhost:8081

## Key Features Demonstrated

### 1. EVV Compliance
- GPS-verified clock in/out
- Geofencing with state-specific tolerances (TX: 100m, FL: 150m)
- 21st Century Cures Act compliance
- HHAeXchange aggregator integration (Texas)

### 2. Offline-First Architecture
- WatermelonDB for local data storage
- Optimistic updates
- Conflict resolution
- Automatic background sync

### 3. Mobile-Specific Features
- Biometric app lock (fingerprint/Face ID)
- Photo verification
- Electronic signature capture
- GPS location tracking
- Push notifications
- Camera integration

### 4. Real-Time Sync
- React Query for data fetching
- WebSocket support (when online)
- Sync status indicators
- Retry logic with exponential backoff

## Development Workflow

### Making Changes to Mobile App

Any changes to the mobile app will automatically appear in both showcase and web demo:

1. Edit mobile source files in `packages/mobile/src/`
2. Expo dev server hot-reloads changes
3. Refresh iframe in showcase/web to see updates
4. No rebuild required during development

### Updating MobileSimulator Component

If you need to modify the simulator frame:

1. Edit `packages/shared-components/src/core/MobileSimulator.tsx`
2. Rebuild shared-components: `cd packages/shared-components && npm run build`
3. Restart showcase/web dev servers

## Configuration

### Custom Mobile Server URL

The showcase allows changing the mobile server URL:

```tsx
// In MobileDemoPage.tsx
const [mobileServerUrl, setMobileServerUrl] = useState('http://localhost:8081');
```

This is useful for:
- Remote mobile servers
- Different network configurations
- Testing production mobile builds

### Device Simulation

The simulator supports different device types:

```tsx
<MobileSimulator
  device="iphone"  // or "android"
  showChrome={true}  // status bar and home indicator
  src="http://localhost:8081"
/>
```

## Deployment Considerations

### Production Deployment

For production, you'll need to:

1. **Deploy mobile web app separately**
   - Build: `npm run build` in packages/mobile
   - Deploy to CDN or static host
   - Update `mobileServerUrl` to production URL

2. **Configure CORS**
   - Mobile server must allow iframe embedding
   - Set appropriate `Content-Security-Policy` headers
   - Configure `X-Frame-Options` if needed

3. **Optimize for production**
   - Enable service worker for offline support
   - Add loading optimizations
   - Configure proper caching headers

### GitHub Pages (Showcase)

The showcase on GitHub Pages will show:
- Error state if mobile server is not running
- Instructions to start mobile locally
- All feature documentation and screenshots

### Vercel (Web Demo)

The web demo can optionally embed mobile app if configured.

## Troubleshooting

### Mobile app not loading in simulator

**Symptom**: Simulator shows "Mobile App Not Running" error

**Solutions**:
1. Verify mobile dev server is running: `cd packages/mobile && npm run web`
2. Check port 8081 is not blocked by firewall
3. Ensure `mobileServerUrl` matches actual server address
4. Check browser console for CORS errors

### Changes not appearing

**Symptom**: Code changes don't show in simulator

**Solutions**:
1. Verify Expo dev server is running and shows "Compiled successfully"
2. Hard refresh the showcase/web page (Cmd+Shift+R / Ctrl+Shift+R)
3. Check for TypeScript/build errors in mobile package
4. Restart Expo dev server if hot reload stopped working

### Iframe sandbox restrictions

**Symptom**: Some features don't work in iframe

**Solutions**:
1. Native device APIs (camera, location) have limited browser support
2. Some features require HTTPS in production
3. Check iframe `sandbox` attribute in MobileSimulator.tsx
4. Test mobile app directly at http://localhost:8081 for full functionality

## Future Enhancements

### Planned Improvements

1. **Screenshot Gallery**
   - Pre-captured screenshots of key screens
   - Fallback when mobile server not running
   - Visual documentation

2. **Guided Tour**
   - Interactive walkthrough of mobile features
   - Annotations and callouts
   - Step-by-step navigation

3. **Multiple Device Preview**
   - Side-by-side iOS and Android
   - Responsive breakpoint testing
   - Different screen sizes

4. **Screen Recording**
   - Capture mobile interactions
   - Generate demo videos
   - Share workflows

5. **Deep Linking**
   - Link directly to specific mobile screens
   - URL-based navigation
   - Shareable demo states

## Related Documentation

- [Mobile App Architecture](../mobile/README.md)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [WatermelonDB Sync](https://watermelondb.dev/docs/Sync)
- [EVV Compliance Requirements](../../docs/compliance/evv-compliance.md)

## Support

For issues or questions:
- GitHub Issues: https://github.com/neighborhood-lab/care-commons/issues
- Discussions: https://github.com/neighborhood-lab/care-commons/discussions
