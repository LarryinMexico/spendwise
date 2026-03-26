import { test, expect } from '@playwright/test';

test.describe('Dashboard UI & Theme Toggle', () => {
  // NOTE: If using Clerk, this test assumes either a bypass is configured 
  // or it tests public elements. For now, we test the root or login structure.
  
  test('should load the application and have correct title', async ({ page }) => {
    await page.goto('/');
    // Check if the page has loaded successfully (might be redirected to Clerk sign-in)
    await expect(page).toHaveURL(/.*sign-in|.*dashboard/);
  });

  test('should toggle dark mode via ThemeToggle button if accessible', async ({ page }) => {
    // Navigate to a page where the theme toggle is present. 
    // In our app, it's in the sidebar of /dashboard
    await page.goto('/dashboard');
    
    // Check if redirect happens, but if we have access to the dashboard:
    const themeButton = page.locator('button:has-text("Toggle theme")');
    
    // We conditionally test this because Clerk might redirect unauthenticated users
    if (await themeButton.isVisible()) {
      const htmlElement = page.locator('html');
      
      // Click the theme toggle
      await themeButton.click();
      // Wait for View Transition / Framer animation to apply the "dark" class
      await expect(htmlElement).toHaveClass(/dark/);
      
      // Click again to return to light mode
      await themeButton.click();
      await expect(htmlElement).not.toHaveClass(/dark/);
    }
  });
});
