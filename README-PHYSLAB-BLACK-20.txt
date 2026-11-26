PHYSLAB BLACK & GOLD — VERSION 20

This update completes the black-and-gold visual system across the site rather than styling only the landing page.

Visual changes:
- Deep near-black graphite page background and restrained warm-gold accents.
- Consistent palette for navigation, cards, laboratory panels, controls, inputs, dialogs, tables, charts, HUD, research workbench, progress and footer.
- Removed remaining violet/cyan styling from common UI components and forced dark appearance even when the old theme toggle selects light/auto.
- Gold focus states, selection, borders and primary actions.
- Mobile-specific palette and reduced-motion support.
- Cache version updated to v20.

Existing laboratory/authentication scripts and experiment definitions are retained.

Deployment: upload the contents of PhysLab-v15 over the previous static frontend. Keep any server/API configuration and backend files untouched. Then hard refresh (Ctrl+Shift+R). If a service worker is installed, close/reopen the site once after deployment.
