import { ThemeProvider as NextThemesProvider } from "next-themes";

const ThemeProvider = ({ children }) => {
  return (
    <NextThemesProvider
      attribute="class" // adds "dark" class to <html> element
      defaultTheme="system" // respects OS preference on first load
      enableSystem={true} // auto-detect OS dark/light
      storageKey="lms-theme" // localStorage key
    >
      {children}
    </NextThemesProvider>
  );
};

export default ThemeProvider;
