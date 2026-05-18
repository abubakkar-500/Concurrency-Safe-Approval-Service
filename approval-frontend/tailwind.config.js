module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        pending: '#fbbf24',
        approved: '#34d399',
        rejected: '#f87171',
      }
    }
  },
  plugins: []
}
