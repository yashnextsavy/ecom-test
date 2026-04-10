// import type { Config } from 'tailwindcss';

// const config: Config = {
//   content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],

//   theme: {
//     container: {
//       center: true,
//          padding: {
//         DEFAULT: "24px",   
//         // sm: "1.5rem",
//         // md: "2rem",
//         // lg: "2.5rem",
//         // xl: "3rem",
//       },
//       screens: {
//         sm: "640px",
//         md: "768px",
//         lg: "1024px",
//         xl: "1280px",
//         "2xl": "1640px", 
//       },
//       // screens: {
//       //   l: '1640px',
//       // },
//     },

//     extend: {
//       colors: {
//           __debug: "#00ff00",
//         primary: {
//           900: 'var(--color-primary-900)',
//           800: 'var(--color-primary-800)',
//           700: 'var(--color-primary-700)',
//         },
//         neutral: {
//           900: 'var(--color-neutral-900)',
//           700: 'var(--color-neutral-700)',
//         },
//       },

//       fontFamily: {
//         primary: ['var(--font-primary)'],
//         secondary: ['var(--font-secondary)'],
//       },

//       borderRadius: {
//         lg: 'var(--radius-lg)',
//       },

//       boxShadow: {
//         lg: 'var(--shadow-lg)',
//       },
//     },
//   },
// };


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    container: {
      center: true,
      padding: "24px",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1640px",
      },
    },

    extend: {
      colors: {
        primary: {
          900: "var(--color-primary-900)",
          800: "var(--color-primary-800)",
          700: "var(--color-primary-700)",
        },
      },
    },
  },
};
