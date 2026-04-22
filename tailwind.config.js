/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'nido-verde': '#7A9482',
                'nido-arena': '#F5F2ED',
            },
        },
    },
    plugins: [],
}