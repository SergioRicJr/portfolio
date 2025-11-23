import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ThreeBackground } from './components/ThreeBackground';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
// import { Experience } from './sections/Experience';
import { Skills } from './sections/Skills';
import { Projects } from './sections/Projects';
import { Articles } from './sections/Articles';
// import { Education } from './sections/Education';
import { Contact } from './sections/Contact';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <div className="relative min-h-screen text-white selection:bg-neon-cyan/30 selection:text-neon-cyan">
        <ThreeBackground />
        <Navbar />

        <main>
          <Hero />
          <About />
          <Projects />
          {/* <Experience /> */}
          <Skills />
          
          <Articles />
          {/* <Education /> */}
          <Contact />
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
