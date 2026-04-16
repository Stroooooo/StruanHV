
export const venv = {
    SERVER: process.env.NEXT_PUBLIC_SERVER_URL,

    // Branding
    LOGO_URL: process.env.NEXT_PUBLIC_LOGO_URL || "https://github.com/Stroooooo/StudentHV/raw/main/assets/logo.png",
    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "StudentHV",

    // Colors
    SIDEBAR_COLOR: process.env.NEXT_PUBLIC_SIDEBAR_COLOR || "#532E80",
    SIDEBAR_TEXT_COLOR: process.env.NEXT_PUBLIC_SIDEBAR_TEXT_COLOR || "#ffffff",
    SIDEBAR_BORDER_COLOR: process.env.NEXT_PUBLIC_SIDEBAR_BORDER_COLOR || "#9ca3af",

    // Login page
    LOGIN_BACKGROUND_IMAGE: process.env.NEXT_PUBLIC_LOGIN_BACKGROUND_IMAGE || "",
    LOGIN_CARD_IMAGE: process.env.NEXT_PUBLIC_LOGIN_CARD_IMAGE || "https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg",
    LOGIN_FIELD_LABEL: process.env.NEXT_PUBLIC_LOGIN_FIELD_LABEL || "Student Number",

    // User settings
    EMAIL_DOMAIN: process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "@nescol.ac.uk",
}
