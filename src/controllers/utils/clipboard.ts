/**
 * Fallback clipboard copy function that works without Clipboard API permissions
 */
export function copyToClipboard(text: string): boolean {
  // Try modern Clipboard API first (may fail due to permissions)
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => {
      // Silently fall through to fallback
      return fallbackCopy(text);
    });
    return true;
  }

  // Use fallback method
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // Make it invisible
  textarea.style.position = 'fixed';
  textarea.style.left = '-999999px';
  textarea.style.top = '-999999px';
  textarea.setAttribute('readonly', '');

  document.body.appendChild(textarea);

  // Select the text
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  // Copy to clipboard
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    console.error('Failed to copy:', err);
  }

  // Remove the textarea
  document.body.removeChild(textarea);

  return success;
}
