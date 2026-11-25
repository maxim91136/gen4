"""Die Testaufrufe in den Actions-Laeufen muessen so laufen, wie sie dort stehen.
Anlass: Lauf Nr. 1 von namen.yml (2026-11-25) brach nach zehn Sekunden ab, weil
`python -m unittest tests.test_orte_bauen tests.test_namen_holen` einen Import nicht fand,
waehrend `discover -s tests` gruen war. Hier wird jeder Aufruf der Form
`python -m unittest tests.…` aus den Workflow-Dateien woertlich vom Wurzelordner aus gestartet.
Aufrufe mit `discover` laufen ohnehin als Ganzes und werden hier nicht wiederholt (dieser Test
wuerde sich sonst selbst aufrufen)."""
import glob, os, re, subprocess, sys, unittest

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MUSTER = re.compile(r"python3? -m unittest((?: tests\.[A-Za-z0-9_.]+)+)\s*$")

def aufrufe():
    aus = []
    for pfad in sorted(glob.glob(os.path.join(WURZEL, ".github", "workflows", "*.yml"))):
        with open(pfad, encoding="utf-8") as f:
            for zeile in f:
                m = MUSTER.search(zeile.rstrip())
                if m:
                    aus.append((os.path.basename(pfad), m.group(1).split()))
    return aus

class Workflows(unittest.TestCase):
    def test_es_gibt_aufrufe(self):
        dateien = {d for d, _ in aufrufe()}
        self.assertIn("namen.yml", dateien)
        self.assertIn("orte.yml", dateien)

    def test_aufrufe_laufen_wie_geschrieben(self):
        for datei, module in aufrufe():
            self.assertNotIn("tests.test_workflows", module)
            with self.subTest(datei=datei, module=module):
                lauf = subprocess.run([sys.executable, "-m", "unittest", *module], cwd=WURZEL,
                                      capture_output=True, text=True, timeout=120)
                self.assertEqual(lauf.returncode, 0, lauf.stderr[-2000:])

if __name__ == "__main__":
    unittest.main()
