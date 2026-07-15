/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'maia-verde': '#7A9482',
                'maia-arena': '#F5F2ED',
            },
        },
    },
    plugins: [],
}