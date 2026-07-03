// ============================================================
//  THEME CONSTANTS & REUSABLE STYLES
// ============================================================

export const COLORS = {
  PRIMARY: '#FD5D4D',
  DANGER: '#c00',
  SUCCESS: '#2ECC71',
  BLUE: '#4A90D9',
  PURPLE: '#8E44AD',
  ORANGE: '#D35400',
  YELLOW: '#F39C12',
  TEAL: '#16A085',
  DARK_BG: '#555',
  TEXT: '#333',
  TEXT_MUTED: '#999',
  TEXT_LIGHT: '#666',
  BORDER: '#ccc',
  BG_LIGHT: '#f9f9f9',
  BG_ROW: '#f5f5f5',
};

export const FONT = {
  FAMILY: 'Helvetica,Arial,sans-serif',
  SIZE_SM: '11px',
  SIZE_MD: '12px',
  SIZE_LG: '13px',
  SIZE_XL: '14px',
};

// ============================================================
//  REUSABLE STYLE STRINGS
// ============================================================

export const STYLE = {
  // Buttons
  BTN_PRIMARY: 'border:none;background:#FD5D4D;color:white;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:11px;font-weight:bold;',
  BTN_PRIMARY_LG: 'border:none;background:#FD5D4D;color:white;border-radius:5px;padding:8px 16px;cursor:pointer;font-size:13px;font-weight:bold;display:block;width:100%;',
  BTN_PRIMARY_SM: 'border:none;background:#FD5D4D;color:white;border-radius:5px;padding:6px 12px;cursor:pointer;font-size:16px;font-weight:bold;',
  BTN_DANGER: 'border:none;background:#c00;color:white;border-radius:5px;padding:8px 16px;cursor:pointer;font-size:12px;font-weight:bold;margin-top:8px;display:block;width:100%;',
  BTN_DANGER_SM: 'border:none;background:transparent;color:#c00;cursor:pointer;font-size:12px;font-weight:bold;padding:2px 4px;',
  BTN_BLUE: 'border:none;background:#4A90D9;color:white;border-radius:4px;padding:6px 8px;cursor:pointer;font-size:11px;font-weight:bold;flex:1;',
  BTN_GREEN: 'border:none;background:#2ECC71;color:white;border-radius:4px;padding:6px 8px;cursor:pointer;font-size:11px;font-weight:bold;flex:1;',
  BTN_SYNC: 'border:none;background:#FD5D4D;color:white;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:11px;font-weight:bold;',
  BTN_DEL_ALL: 'border:none;background:#c00;color:white;border-radius:5px;padding:8px 16px;cursor:pointer;font-size:12px;font-weight:bold;margin-top:8px;display:block;width:100%;',

  // Panel
  PANEL: 'position:fixed;bottom:72px;right:20px;width:280px;max-height:420px;background:white;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);z-index:999999;padding:14px;font-family:Helvetica,Arial,sans-serif;color:#333;overflow:hidden;display:flex;flex-direction:column;text-align:left;',
  PANEL_CONTENT: 'flex:1;overflow-y:auto;min-height:200px;max-height:300px;',
  TAB_BAR: 'display:flex;margin-bottom:10px;border-bottom:2px solid #eee;gap:4px;',
  TAB_ACTIVE: 'flex:1;text-align:center;padding:6px;cursor:pointer;font-size:13px;font-weight:bold;color:#FD5D4D;border-bottom:2px solid #FD5D4D;margin-bottom:-2px;',
  TAB_INACTIVE: 'flex:1;text-align:center;padding:6px;cursor:pointer;font-size:13px;color:#999;',

  // Titles & text
  TITLE: 'font-size:14px;font-weight:bold;margin-bottom:8px;',
  TITLE_MB12: 'font-size:14px;font-weight:bold;margin-bottom:12px;',
  DESC: 'font-size:12px;color:#666;margin-bottom:8px;',
  EMPTY: 'font-size:12px;color:#999;font-style:italic;',

  // User rows
  USER_ROW: 'display:flex;justify-content:space-between;align-items:center;padding:4px 6px;border-bottom:1px solid #f5f5f5;font-size:13px;',
  USER_LIST: 'margin-bottom:8px;max-height:180px;overflow-y:auto;',

  // Input
  INPUT: 'flex:1;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:13px;',
  TEXTAREA: 'width:100%;height:120px;border:1px solid #ccc;border-radius:5px;padding:6px;font-size:13px;box-sizing:border-box;resize:vertical;',
  INPUT_ROW: 'display:flex;gap:6px;',

  // OP row
  OP_ROW: 'display:flex;align-items:center;gap:8px;padding:6px 4px;margin-bottom:8px;background:#f9f9f9;border-radius:6px;',

  // Floating buttons
  FLOAT_BTN: 'width:44px;height:44px;border-radius:22px;border:2px solid #555;background:#555;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;padding:0;color:white;font-size:20px;font-weight:bold;transition:background 0.2s;',
  FLOAT_WRAP: 'position:fixed;bottom:20px;right:20px;z-index:999999;font-family:Helvetica,Arial,sans-serif;display:flex;flex-direction:column;gap:8px;align-items:flex-end;',
  FC_BTN: 'width:44px;height:44px;border-radius:22px;border:2px solid #FD5D4D;background:#FD5D4D;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;padding:0;',
  FC_ICON: 'width:24px;height:24px;border-radius:4px;',

  // Copy/paste row
  COPY_ROW: 'display:flex;gap:10px;margin-top:8px;',

  // Accordion
  ACCORDION_HEADER: 'font-size:12px;font-weight:bold;color:#FD5D4D;cursor:pointer;padding:4px 0;margin-bottom:4px;user-select:none;',
  PRESET_CONTAINER: 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;',

  // Misc
  OP_LABEL: 'font-size:13px;color:#999;flex:1;font-style:italic;',
  OP_LABEL_FOUND: 'font-size:13px;font-weight:bold;color:#333;flex:1;',
  IGNORE_BTN: 'margin-left:2px;font-size:12px;font-weight:bold;cursor:pointer;text-decoration:none;color:#FD5D4D;vertical-align:baseline;',
  CONFIG_ROW: 'display:flex;align-items:center;justify-content:space-between;padding:6px 0;',
  CONFIG_LABEL: 'font-size:13px;color:#333;flex:1;',
  CONFIG_DESC: 'font-size:11px;color:#999;margin:-2px 0 6px 0;',

  // Hidden summary (from hide-threads.ts)
  HIDDEN_SUMMARY: 'margin:10px;padding:16px;border-radius:12px;background:var(--section-background-color,#f0f0f0);border:1px solid var(--separator-color,#ddd);font-family:Helvetica,Arial,sans-serif;font-size:13px;color:var(--text-color,#666);',
  HIDDEN_HEADER: 'font-weight:bold;margin-bottom:10px;font-size:14px;color:var(--gray-text,#888);',
  HIDDEN_ROW: 'padding:3px 0;opacity:0.5;font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;',
  HIDDEN_INFO: 'color:var(--gray-text,#999);font-size:11px;',

  // Toast
  TOAST: 'position:fixed;bottom:25px;right:76px;z-index:9999999;background:#333;color:white;padding:10px 16px;border-radius:8px;font-family:Helvetica,Arial,sans-serif;font-size:13px;box-shadow:0 2px 12px rgba(0,0,0,0.3);max-width:300px;word-wrap:break-word;transition:opacity 0.3s;opacity:1;',

  // Post placeholder
  POST_PLACEHOLDER: 'padding:20px;text-align:center;font-size:13px;color:#999;font-style:italic;background:#f5f5f5;border-radius:6px;margin:8px;',
};
