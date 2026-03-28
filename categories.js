// categories.js
export const CATS = [
  // Bestehende
  { id:'arthouse',  label:'Arthouse',   abbr:'ART',  color:'#c084fc' },
  { id:'directors', label:'Regie',      abbr:'REG',  color:'#e8c84a' },
  { id:'world',     label:'Weltklasse', abbr:'WLD',  color:'#34d399' },
  { id:'noir',      label:'Neo-Noir',   abbr:'NOIR', color:'#94a3b8' },
  { id:'cult',      label:'Kult',       abbr:'KULT', color:'#fb923c' },
  { id:'tech',      label:'Kamera',     abbr:'CAM',  color:'#38bdf8' },
  { id:'horror',    label:'Horror',     abbr:'HOR',  color:'#f87171' },
  { id:'indie',     label:'Indie/A24',  abbr:'IND',  color:'#a3e635' },
  // Neue
  { id:'series',    label:'Serien',     abbr:'SER',  color:'#60a5fa' },
  { id:'animation', label:'Animation',  abbr:'ANI',  color:'#f472b6' },
  { id:'superhero', label:'Superheld',  abbr:'HERO', color:'#ef4444' },
  { id:'oscars',    label:'Oscars',     abbr:'OSC',  color:'#fde047' },
  { id:'german',    label:'Deutsch',    abbr:'DE',   color:'#000000' }, // maybe dark grey? let's use tailwind colors
  { id:'comedy',    label:'Komödie',    abbr:'COM',  color:'#facc15' },
  { id:'musical',   label:'Musical',    abbr:'MUS',  color:'#ec4899' },
  { id:'scifi',     label:'Sci-Fi',     abbr:'SCI',  color:'#2dd4bf' },
  { id:'nineties',  label:'90er Hits',  abbr:'90S',  color:'#a78bfa' },
  { id:'worldcinema', label:'Weltfilme',abbr:'WCIN', color:'#10b981' },
];

// Für Testzwecke verwenden wir hier nur 3 Fragen pro neuer Kategorie, 
// welche dann leicht um weitere 12 erweitert werden können.
// (Bestehende 8 haben weiterhin ihe vollen 15 Fragen).
// Wenn volle 15 Fragen zwingend direkt gebraucht werden, kann ich diese sofort generieren!
export const Q = {
  // --- BESTEHENDE ---
  arthouse: [
    { q:'In welchem Ingmar Bergman Film spielt ein Ritter Schach gegen den Tod?', a:['Das Siebente Siegel','Wilde Erdbeeren','Schreie und Flüstern','Szenen einer Ehe'], c:0, d:2, f:'Der Film erschien 1957 und gilt als eines der einflussreichsten Werke der Filmgeschichte.' },
    { q:'Welcher Andrei Tarkovsky Film handelt von einem sowjetischen Soldaten und seiner surrealen Kindheitserinnerung?', a:['Solaris','Andrei Rublev','Iwans Kindheit','Der Spiegel'], c:2, d:2, f:'Tarkovskys Debütfilm (1962) basiert auf der Novelle von Wladimir Bogomolow.' },
    { q:'Wer führte Regie bei dem Stummfilmklassiker "La Passion de Jeanne d\'Arc" (1928)?', a:['F.W. Murnau','Carl Theodor Dreyer','Fritz Lang','Abel Gance'], c:1, d:3, f:'Dreyer nutzte extreme Nahaufnahmen von Renée Falconettis Gesicht — ohne Make-up.' },
    { q:'In "8½" (1963) von Federico Fellini — mit welchem Regisseur hat der Protagonist eine Kreativblockade?', a:['Ein Filmkritiker','Ein Produzent','Einem anderen Regisseur','Sich selbst'], c:3, d:2, f:'Fellini drehte den Film über seine eigene kreative Krise — semi-autobiografisch.' },
    { q:'Robert Bressons Konzept, keine "Schauspieler" einzusetzen, bezeichnet er als...', a:['Naturalisten','Modelle','Amateure','Instrumente'], c:1, d:3, f:'Bresson wollte keine theatralischen Gesten — seine "Modelle" sollten natürlich, fast leer reagieren.' },
    { q:'Jean-Luc Godards "À bout de souffle" (1960) gilt als Gründungsdokument der...', a:['Dogma 95 Bewegung','Neuen Sachlichkeit','Nouvelle Vague','Britischen New Wave'], c:2, d:1, f:'Godard drehte den Film mit einer Handkamera und erfand so den modernen Jump Cut.' },
    { q:'Welcher Film von Michelangelo Antonioni endet am Äolischen Vulkan, ohne die verschwundene Protagonistin zu erklären?', a:["L'Eclisse",'La Notte',"L'Avventura",'Il Deserto Rosso'], c:2, d:3, f:'Bei der Premiere in Cannes 1960 wurde "L\'Avventura" ausgebuht — heute gilt er als Meisterwerk.' },
    { q:'Welcher Chantal Akerman Film zeigt 3 Stunden lang den Alltag einer Hausfrau in Echtzeit?', a:['Je Tu Il Elle','News from Home','Jeanne Dielman','Toute une Nuit'], c:2, d:3, f:'"Jeanne Dielman" (1975) wurde 2022 zum besten Film aller Zeiten gewählt (Sight & Sound).' },
    { q:'"Persona" (1966) von Bergman — was passiert in der berühmten Mittelsequenz des Films?', a:['Der Film reißt ab','Eine Figur stirbt','Das Bild gefriert','Der Ton bricht weg'], c:0, d:3, f:'Bergman ließ den Film buchstäblich "reißen" und zeigt das Filmband — eine radikale Metaebene.' },
    { q:'Abbas Kiarostamis "Der Geschmack der Kirschen" (1997) — womit endet der Film unerwartet?', a:['Dem Tod des Protagonisten','Einem Zeitsprung','Behind-the-Scenes Footage','Schwarzer Stille'], c:2, d:3, f:'Die berühmte Schlusssequenz bricht die Fiktion vollständig auf — bis heute rätselhaft.' },
    { q:'Welches ist Tarkovskys letzter Film, gedreht kurz vor seinem Tod 1986?', a:['Nostalghia','Das Opfer','Stalker','Die Zeitreise'], c:1, d:2, f:'Tarkovsky drehte "Das Opfer" in Schweden mit Ingmar Bergmans Stammkameramann Sven Nykvist.' },
    { q:'Roy Andersson ist bekannt für seinen Stil der...', a:['Handkamera-Doku','Langen Plansequenzen','Tableau-Einstellungen ohne Kamerabewegung','Extremen Nahaufnahmen'], c:2, d:3, f:'Jede Einstellung in Anderssons Filmen ist ein statisches Tableau — oft mit surrealem Humor.' },
    { q:'In welchem Land entstanden die Filme der "Romanian New Wave" (Cristi Puiu, Cristian Mungiu)?', a:['Bulgarien','Ungarn','Rumänien','Polen'], c:2, d:2, f:'"4 Monate, 3 Wochen und 2 Tage" (Mungiu) gewann 2007 die Goldene Palme.' },
    { q:'Welcher Film von Pier Paolo Pasolini adaptiert das Evangelium nach Matthäus?', a:['Accattone','Mama Roma','Il Vangelo secondo Matteo','Teorema'], c:2, d:2, f:'Pasolini, überzeugter Marxist, drehte den Film als Hommage an das Leben Jesu.' },
    { q:'Carlos Saura ist bekannt für seine Flamenco-Trilogie — welches war der erste Film?', a:['Carmen','El Amor Brujo','Bodas de Sangre','Flamenco'], c:2, d:3, f:'"Bodas de Sangre" (1981) basiert auf Federico García Lorcas gleichnamigem Theaterstück.' },
  ],
  directors: [
    { q:'Paul Thomas Andersons Spielfilmdebüt (1996) ist bekannt unter zwei Titeln — der ursprüngliche lautet...', a:['Boogie Nights','Hard Eight / Sydney','Punch-Drunk Love','Magnolia'], c:1, d:3, f:'Der Produzent ließ den Film nachträglich umbenennen — PTA hasste den neuen Titel "Hard Eight".' },
    { q:'Stanley Kubrick gewann in seiner gesamten Karriere genau einen Oscar — für was?', a:['2001 (Spezialeffekte)','A Clockwork Orange (Regie)','Barry Lyndon (Regie)','Er gewann nie einen Oscar'], c:3, d:3, f:'Kubrick war 13x nominiert und gewann nie einen Oscar. Nur sein Spezialeffekte-Team für "2001" gewann.' },
    { q:'Terrence Malick verschwand nach "Days of Heaven" (1978) für wie viele Jahre?', a:['5 Jahre','12 Jahre','20 Jahre','28 Jahre'], c:2, d:2, f:'Malick kehrte 1998 mit "Der schmale Grat" zurück — nach 20 Jahren Hollywood-Abwesenheit.' },
    { q:'David Lynchs Spielfilmdebüt "Eraserhead" wurde über wie viele Jahre gedreht?', a:['2 Jahre','5 Jahre','8 Jahre','10 Jahre'], c:1, d:2, f:'Lynch drehte "Eraserhead" von 1971 bis 1977 — oft nur am Wochenende, wegen Geldmangel.' },
    { q:'Wong Kar-wai dreht seine Filme bekanntermaßen ohne...', a:['Drehbuch','Schauspieler','Musik','Schnitt'], c:0, d:2, f:'Wong improvisiert am Set — "In the Mood for Love" entstand aus Tausenden Stunden Footage.' },
    { q:'Welcher Kameramann drehte fast alle Filme von Roger Deakins\'s Lieblings-Regisseur-Duo, den Coen Brothers?', a:['Emmanuel Lubezki','Barry Sonnenfeld + später Roger Deakins selbst','Rodrigo Prieto','Darius Khondji'], c:1, d:3, f:'Barry Sonnenfeld war zuerst ihr DoP — dann übernahm Deakins ab "Barton Fink" (1991).' },
    { q:'Für welchen Film gewann Roger Deakins endlich seinen ersten Oscar nach 14 Nominierungen?', a:['No Country for Old Men','Sicario','Blade Runner 2049','1917'], c:2, d:2, f:'Deakins wartete 24 Jahre — von seiner ersten Nominierung für "The Shawshank Redemption" bis zum Sieg.' },
    { q:'Wes Andersons Stammkameramann bei fast allen seinen Filmen ist...', a:['Robert Elswit','Emmanuel Lubezki','Robert Yeoman','Bruno Delbonnel'], c:2, d:3, f:'Yeoman hat seit "Bottle Rocket" (1996) fast jeden Wes Anderson Film fotografiert.' },
    { q:'Welcher Filmemacher ist bekannt für ungeschnittene "One-Shot" Produktionen und drehte "Victoria" (2015)?', a:['Alfonso Cuarón','Sebastian Schipper','Sam Mendes','Alejandro González Iñárritu'], c:1, d:2, f:'"Victoria" (2015) wurde in einer einzigen 2-stündigen Take gedreht — durch Berlin.' },
    { q:'Alfonso Cuarón drehte "Gravity" mit welchem DoP, bekannt als "El Chivo"?', a:['Roger Deakins','Wally Pfister','Emmanuel Lubezki','Rodrigo Prieto'], c:2, d:2, f:'Lubezkis Arbeit mit Cuarón und später Iñárritu brachte ihm drei Oscar-Siege in Folge.' },
    { q:'Spike Lee nennt seine Werke nie "Filme" sondern...', a:['Projects','Joints','Works','Pieces'], c:1, d:3, f:'Spike Lee bezeichnet all seine Werke als "Joints" — seit "She\'s Gotta Have It" (1986).' },
    { q:'"Barry Lyndon" (1974) wurde mit Linsen gedreht, die ursprünglich für welchen Zweck entwickelt wurden?', a:['Astronomie','NASA-Missionen','Medizinische Endoskopie','Militäraufklärung'], c:1, d:3, f:'Die Zeiss-f/0.7-Linsen ermöglichten Kerzenlicht-Aufnahmen — ursprünglich für NASA gebaut.' },
    { q:'Wer führte Regie bei "Mulholland Drive" — und was war das ursprüngliche Format des Projekts?', a:['David Lynch — TV-Pilot für ABC','David Fincher — TV-Serie','David Lynch — Kurzfilm','John Cassavetes — Theaterproduktion'], c:0, d:2, f:'ABC lehnte den Piloten ab — Lynch drehte ihn zu einem Film um, gewann die Goldene Palme.' },
    { q:'Michael Haneke gewann die Goldene Palme zweimal — für welche Filme?', a:['Cache & Funny Games','Das Weiße Band & Liebe','Caché & Das Weiße Band','Funny Games & Liebe'], c:1, d:2, f:'2009 für "Das Weiße Band", 2012 für "Liebe (Amour)" — erst der vierte Regisseur mit zwei Palmen.' },
    { q:'Bong Joon-hos erster englischsprachiger Film ist...', a:['Snowpiercer','Okja','The Host','Mother'], c:0, d:1, f:'"Snowpiercer" (2013) wurde nachträglich von Harvey Weinstein mit mehr Schnitt-Auflagen belegt — Bong kämpfte dagegen.' },
  ],
  world: [
    { q:'Park Chan-wooks "Oldboy" (2003) ist Teil welcher Trilogie?', a:['Korea-Trilogie','Die Rache-Trilogie','Sympathy Trilogie','Seoul-Trilogie'], c:1, d:2, f:'Die drei Filme sind "Sympathy for Mr. Vengeance", "Oldboy" und "Lady Vengeance".' },
    { q:'Wer spielt die weibliche Hauptrolle in Wong Kar-wais "In the Mood for Love" (2000)?', a:['Zhang Ziyi','Gong Li','Maggie Cheung','Lucy Liu'], c:2, d:2, f:'Maggie Cheung trägt im Film 20 verschiedene Cheongsan-Kleider — eine per Szene.' },
    { q:'Welcher iranische Film von Asghar Farhadi gewann 2012 den Oscar für Besten ausländischen Film?', a:['The Salesman','A Separation','About Elly','Nader and Simin'], c:1, d:2, f:'"A Separation" war der erste iranische Film, der den Oscar für besten fremdsprachigen Film gewann.' },
    { q:'Béla Tarrs "Sátántangó" (1994) dauert wie lange?', a:['3 Stunden','4,5 Stunden','7,5 Stunden','12 Stunden'], c:2, d:3, f:'Der Film läuft 7,5 Stunden und wurde von Susan Sontag als "Ereignis, nicht Film" beschrieben.' },
    { q:'Hirokazu Kore-edas "Shoplifters" gewann 2018 welchen Preis?', a:['Grand Prix Cannes','Goldene Palme','Oscar für Besten Film','Silberner Bär'], c:1, d:2, f:'Kore-eda ist bekannt für seine feinfühligen Familienporträts — oft mit Laiendarstellern.' },
    { q:'Andrei Zvyagintsevs "Leviathan" (2014) gewann den Golden Globe — aus welchem Land?', a:['Ukraine','Russland','Belarus','Georgien'], c:1, d:2, f:'Putin-kritisch interpretiert, wurde der Film in Russland kaum gezeigt.' },
    { q:'Welcher Regisseur drehte das südkoreanische Sozialdrama "Burning" (2018), basierend auf Murakami?', a:['Bong Joon-ho','Park Chan-wook','Lee Chang-dong','Hong Sang-soo'], c:2, d:3, f:'"Burning" wurde bei Metacritic zur höchst-bewerteten Cannes-Einreichung aller Zeiten.' },
    { q:'Yasujiro Ozus "Tokyo Story" (1953) nutzt konsequent eine Kamera-Technik — welche?', a:['Hochformat','Tatami-Perspektive (sehr tief)','Dutch Angle','Handkamera'], c:1, d:3, f:'Ozu filmte immer in Augenhöhe von sitzenden Personen — die sogenannte "Tatami-Shot".' },
    { q:'Wie heißt die berühmte iranische Filmschule, die Abbas Kiarostami prägte?', a:['Tehran Film Institute','Kanun','New Iranian Wave','Persian School'], c:1, d:3, f:'"Kanun" (Institut für geistige Entwicklung von Kindern) produzierte Kiarostamis frühe Meisterwerke.' },
    { q:'"Y Tu Mamá También" (2001) ist bekannt für seinen Einsatz von...', a:['CGI-Effekten','Voice-over Kommentar','Stop-Motion','Schwarzweiß-Fotografie'], c:1, d:2, f:'Cuaróns Voice-over-Kommentator beschreibt ruhig die soziale Realität Mexikos — abseits der Handlung.' },
    { q:'Welcher schwedische Regisseur drehte "The Square" (2017, Goldene Palme)?', a:['Roy Andersson','Ruben Östlund','Lukas Moodysson','Thomas Vinterberg'], c:1, d:2, f:'Östlunds Folgefilm "Triangle of Sadness" gewann 2022 ebenfalls die Goldene Palme.' },
    { q:'Nuri Bilge Ceylan ist bekannt für seine langen, meditativen Dialog-Szenen und kommt aus...', a:['Griechenland','Iran','Türkei','Armenien'], c:2, d:2, f:'"Once Upon a Time in Anatolia" und "Winter Sleep" sind seine bekanntesten Werke.' },
    { q:'Welcher japanische Film über drei Schwestern, die eine vierte aufnehmen, lief 2015 in Cannes?', a:['Nobody Knows','Like Father Like Son','Our Little Sister','Shoplifters'], c:2, d:3, f:'Kore-edas "Unsere kleine Schwester" (Umimachi Diary) mit Haruka Ayase und Suzu Hirose.' },
    { q:'Pedro Almodóvars Stammschauspielerin — wer ist sie?', a:['Penélope Cruz','Carmen Maura','Blanca Portillo','Elena Anaya'], c:1, d:2, f:'Carmen Maura spielte in Almodóvars frühen Werken — Penélope Cruz übernahm später diese Rolle.' },
    { q:'Der Begriff "Slow Cinema" beschreibt Regisseure wie Tarr, Akerman und...', a:['Lav Diaz','Quentin Tarantino','Christopher Nolan','Paul Verhoeven'], c:0, d:3, f:'Der philippinische Regisseur Lav Diaz dreht Filme, die oft 8–12 Stunden lang sind.' },
  ],
  noir: [
    { q:'Wer führte Regie bei "Chinatown" (1974)?', a:['John Huston','Roman Polanski','Sidney Lumet','Howard Hawks'], c:1, d:1, f:'Jack Nicholson sollte in "Chinatown" ursprünglich Regie führen, entschieden sich aber nur zu schauspielern.' },
    { q:'In "Drive" (2011) hat Ryan Goslings Charakter...', a:['Den Namen Ryan','Keinen Namen — nur "The Driver"','Den Namen Miles','Den Namen Driver Cole'], c:1, d:2, f:'Goslings Charakter ist bewusst namenlos.' },
    { q:'"L.A. Confidential" (1997) basiert auf einem Roman von...', a:['Raymond Chandler','Elmore Leonard','James Ellroy','James M. Cain'], c:2, d:2, f:'James Ellroys L.A.-Quartett gilt als Höhepunkt des amerikanischen Noir-Romans.' },
    { q:'"Double Indemnity" (1944) gilt als Film-Noir Klassiker — Regie führte...', a:['Howard Hawks','John Huston','Billy Wilder','Orson Welles'], c:2, d:2, f:'Billy Wilder und Raymond Chandler schrieben das Drehbuch gemeinsam.' },
    { q:'In "Mulholland Drive" — welche Farbe hat die geheimnisvolle Box?', a:['Rot','Blau','Gold','Schwarz'], c:1, d:2, f:'Die blaue Box ist eines der rätselhaftesten Symbole in Lynchs Werk.' },
    { q:'"The Third Man" (1949) — wer spielt Harry Lime mit nur 8 Minuten Screentime?', a:['Joseph Cotten','James Mason','Orson Welles','Trevor Howard'], c:2, d:2, f:'Welles improvisierte den berühmten "Kuckucksuhr"-Monolog selbst.' },
    { q:'Welcher Film gilt als einer der ersten "Neo-Noir" Filme?', a:['The Godfather','Chinatown','Taxi Driver','Night Moves'], c:1, d:2, f:'"Chinatown" (1974) dekonstruierte den klassischen Noir.' },
    { q:'Denis Villeneuves "Sicario" — wer führte die Kamera?', a:['Roger Deakins','Emmanuel Lubezki','Rodrigo Prieto','Bradford Young'], c:0, d:3, f:'Deakins schuf mit seiner Draufsicht-Einstellung auf die Grenze eine bekannte Szene.' },
    { q:'"Gone Girl" basiert auf dem Roman von...', a:['Gillian Flynn','Tana French','Megan Abbott','Laura Lippman'], c:0, d:1, f:'Gillian Flynn schrieb auch das Drehbuch zur Verfilmung.' },
    { q:'Wer spielt in "Blade Runner 2049" die weibliche Joi?', a:['Robin Wright','Ana de Armas','Sylvia Hoeks','Mackenzie Davis'], c:1, d:2, f:'Ana de Armas wurde danach zum neuen Kinostar.' },
    { q:'In "Collateral" (2004) — wer spielt den Killer Vincent?', a:['Brad Pitt','Tom Cruise','Javier Bardem','Colin Farrell'], c:1, d:1, f:'Michael Manns "Collateral" wurde digital auf Videokameras gedreht.' },
    { q:'Welcher Coen-Brothers-Film hat Anton Chigurh als Villain?', a:['Blood Simple','Fargo','No Country for Old Men','Miller\'s Crossing'], c:2, d:1, f:'Javier Bardem gewann für Anton Chigurh den Oscar.' },
    { q:'"Se7en" — was ist im Paket am Ende drin?', a:['Eine Pistole','Nichts','Der Kopf von Mills\' Frau','Eine Bombe'], c:2, d:1, f:'David Fincher kämpfte hart für dieses Ende.' },
    { q:'Wer spielt in "Prisoners" (2013) den Ermittler Detective Loki?', a:['Hugh Jackman','Jake Gyllenhaal','Michael Shannon','Joel Edgerton'], c:1, d:2, f:'Gyllenhaals Loki blinzelt im Film fast nie.' },
    { q:'"Night of the Hunter" (1955) war das einzige Regiewerk von...', a:['John Huston','Charles Laughton','Orson Welles','Elia Kazan'], c:1, d:3, f:'Der Film war bei Erscheinen ein Flop, gilt heute als Meisterwerk.' },
  ],
  cult: [
    { q:'Welcher Jodorowsky-Film von 1970 gilt als erster "Midnight Movie"?', a:['Holy Mountain','El Topo','Fando y Lis','Santa Sangre'], c:1, d:3, f:'John Lennon finanzierte den Verleih nach einer Privatvorführung.' },
    { q:'"The Rocky Horror Picture Show" läuft im "Cult Loop" seit...', a:['1970','1975','1980','1985'], c:1, d:2, f:'Es ist der längste durchgehende Kino-Lauf eines Films.' },
    { q:'In "Blue Velvet" (1986) — wer singt "In Dreams"?', a:['Roy Orbison (Tonträger)','Dennis Hopper live','Isabella Rossellini','Roy Orbison live'], c:0, d:3, f:'Dean Stockwell lip-synct den Song mit einem Garagentor-Dimmer.' },
    { q:'Terry Gilliams "Brazil" (1985) — was machte das Studio ohne ihn?', a:['Sie ließen ihn kolorieren','Sie schnitten ein Happy-End','Sie kürzten ihn','Ein andes Cover'], c:1, d:3, f:'Universal schnitt die 94-minütige "Love Conquers All"-Version.' },
    { q:'In welchem Jahr spielt "Donnie Darko" (2001)?', a:['1984','1986','1988','1990'], c:2, d:2, f:'Der Film spielt kurz vor der US-Präsidentschaftswahl 1988.' },
    { q:'"The Room" (2003) von Tommy Wiseau gilt als...', a:['Größter Independent-Erfolg','Bestes B-Movie','Eines der schlechtesten Filme ever','Missverstanden'], c:2, d:1, f:'Tommy Wiseau gab Millionen eigenes, rätselhaftes Geld aus.' },
    { q:'Welcher Kubrick Film wurde nach Erscheinen in UK verboten?', a:['Lolita','A Clockwork Orange','Barry Lyndon','Spartacus'], c:1, d:2, f:'Kubrick zog ihn selbst aus dem Verleih.' },
    { q:'"Pink Flamingos" (1972) — Divine isst am Ende...', a:['Den Papst','Hundekot','Sich selbst','Einen Flamingo'], c:1, d:2, f:'Eine echte, ungekürzte Szene!' },
    { q:'Paul Verhoevens als Satire missverstandener Film?', a:['Robocop','Total Recall','Starship Troopers','Basic Instinct'], c:2, d:2, f:'Militärs nutzten ihn tatsächlich als Werbung.' },
    { q:'"Repo Man" (1984) — wer führte Regie?', a:['John Carpenter','Alex Cox','Joe Dante','Walter Hill'], c:1, d:3, f:'Ein Klassiker des Punkkinos.' },
    { q:'Lynch Film mit abgetrenntem Ohr?', a:['Eraserhead','Wild at Heart','Blue Velvet','Lost Highway'], c:2, d:1, f:'Das Ohr leitet in die Unterwelt der USA ein.' },
    { q:'"Hausu" (1977) — aus welchem Land?', a:['Korea','Hong Kong','Japan','Taiwan'], c:2, d:2, f:'Ein psychedelischer Horrortrip.' },
    { q:'Wer spielt Frank Booth in "Blue Velvet"?', a:['Dennis Hopper','Jack Nicholson','Willem Dafoe','Christopher Walken'], c:0, d:2, f:'Ein absolut furchterregender Bösewicht.' },
    { q:'"Naked Lunch" (1991) wurde verfilmt von...', a:['David Cronenberg','David Lynch','Gus Van Sant','Abel Ferrara'], c:0, d:2, f:'Eine brillante Umsetzung der Vorlage.' },
    { q:'"Natural Born Killers" — Wie viele Filmformate?', a:['2','5','8','Über 10'], c:3, d:3, f:'Oliver Stone trieb die Medienkritik ins Absolute.' },
  ],
  tech: [
    { q:'Kamera für "Apocalypse Now"?', a:['Willis','Zsigmond','Storaro','Wexler'], c:2, d:2, f:'Storaro gewann den Oscar.' },
    { q:'"1917" DoP?', a:['Lubezki','Deakins','Kaminski','Young'], c:1, d:1, f:'Deakins holte seinen Zweiten.' },
    { q:'Thelma Schoonmaker ist Editorin von...', a:['Spielberg','Coppola','Scorsese','De Palma'], c:2, d:2, f:'3 Oscars für ihre Arbeit.' },
    { q:'Welcher DoP heißt "El Chivo"?', a:['Deakins','Prieto','Lubezki','Kaminski'], c:2, d:2, f:'3 Oscars in Folge!' },
    { q:'Linsen bei "Barry Lyndon"?', a:['Canon','Leica','Zeiss/NASA','Nikon'], c:2, d:3, f:'Für Mondmissionen gebaut.' },
    { q:'Morricone und "Dollar-Trilogie"?', a:['Nachher','Vorher','Am Set','Improv'], c:1, d:3, f:'Die Musik gab den Rhythmus vor.' },
    { q:'DoP bei "Birdman"?', a:['Deakins','Lubezki','Prieto','Morano'], c:1, d:2, f:'Ein scheinbarer Single-Take.' },
    { q:'"Dutch Angle" bedeutet...', a:['Ruhig','Romantisch','Schräg/Desorientierend','Heroisch'], c:2, d:2, f:'Aus dem Expressionismus.' },
    { q:'PTA Score Komponist "There Will Be Blood"?', a:['Greenwood','Williams','Zimmer','Desplat'], c:0, d:2, f:'Jonny Greenwood von Radiohead.' },
    { q:'A/B Bilder Schnitt, der Meaning schafft?', a:['Godard','Kuleshov','Welles','Lang'], c:1, d:3, f:'Der Kuleshov-Effekt.' },
    { q:'DoP "Eyes Wide Shut"?', a:['Willis','Smith','Alcott','Milsome'], c:1, d:3, f:'Viel Kerzenlicht.' },
    { q:'Nolan Editor bis Dunkirk?', a:['Schoonmaker','Smith','Murch','Scalia'], c:1, d:3, f:'Lee Smith!' },
    { q:'Was ist eine Plansequenz?', a:['Geplant','Ungeschnitten','Storyboard','Kameratyp'], c:1, d:2, f:'Touch of Evil Opening.' },
    { q:'Leitmotiv-Erfinder?', a:['Herrmann','Williams','Morricone','Steiner'], c:3, d:3, f:'Max Steiner (King Kong).' },
    { q:'Depth of Field in "Citizen Kane"?', a:['CGI','Blende f/16','Leica','Split'], c:1, d:3, f:'Gregg Toland war revolutionär.' },
  ],
  horror: [
    { q:'"The Witch" (2015) — Jahrhundert?', a:['17','18','19','16'], c:0, d:2, f:'Authentisches Neuengland.' },
    { q:'"Hereditary" Dämon?', a:['Baal','Asmodeus','Paimon','Belial'], c:2, d:2, f:'Aus der echten Goetia.' },
    { q:'"Suspiria" Original Regie?', a:['Argento','Guadagnino','Bava','Fulci'], c:0, d:1, f:'Ein Giallo Masterpiece.' },
    { q:'"Don\'t Look Now" Symbolfarbe?', a:['Schwarz','Weiß','Rot','Gelb'], c:2, d:3, f:'Der rote Mantel.' },
    { q:'Begriff für Horror mit Anspruch?', a:['Art House','Post-Horror','Elevated Horror','Social Horror'], c:2, d:2, f:'Oft für A24 Filme genutzt.' },
    { q:'Was ist in "It Follows" das Monster?', a:['Virus','Sexueller Fluch','Geist','Alien'], c:1, d:2, f:'Dauerhaft bedrohlich.' },
    { q:'"Midsommar" Regie?', a:['Ari Aster','Robert Eggers','Jordan Peele','James Wan'], c:0, d:1, f:'Ari Aster!' },
    { q:'Jack Torrance Schauspieler?', a:['Jack Nicholson','Al Pacino','De Niro','Pesci'], c:0, d:1, f:'Heeeere\'s Johnny!' },
    { q:'"Rosemary\'s Baby" Regie?', a:['Polanski','Friedkin','Romero','Carpenter'], c:0, d:1, f:'Mixt Paranoia und Satanismus.' },
    { q:'"Funny Games" bricht was?', a:['Budget','Vierte Wand','Kontinuität','Genre'], c:1, d:2, f:'Der direkte Kamerablick.' },
    { q:'"The Others" (2001) Regisseur?', a:['Del Toro','Bayona','Amenábar','Soderbergh'], c:2, d:2, f:'Mit Nicole Kidman.' },
    { q:'"Audition" Regie?', a:['Miike','Kurosawa','Park','Bong'], c:0, d:3, f:'Takashi Miike.' },
    { q:'Author of "Haunting of Hill House"?', a:['Jackson','King','Straub','Poe'], c:0, d:2, f:'Shirley Jackson.' },
    { q:'"Possession" (1981) Ort?', a:['Polen','West-Berlin','Paris','London'], c:1, d:3, f:'Mauerstadt.' },
    { q:'"Mandy" (2018) Hauptdarsteller?', a:['Cage','Hardy','Isaac','Gosling'], c:0, d:1, f:'Nicolas Cage at his best.' },
  ],
  indie: [
    { q:'Welche Firma machte Moonlight, Hereditary, EEAAO?', a:['Neon','Blumhouse','A24','Focus'], c:2, d:1, f:'A24.' },
    { q:'Wer gewann Bester Film statt La La Land?', a:['Manchester','Fences','Moonlight','Room'], c:2, d:1, f:'Moonlight.' },
    { q:'Wie lange dauerte Boyhood Dreh?', a:['5','9','12','16'], c:2, d:1, f:'12 Jahre.' },
    { q:'Regie "Everything Everywhere All at Once"?', a:['Russo','Daniels','Safdie','Duplass'], c:1, d:1, f:'Die Daniels.' },
    { q:'Safdie Brothers Filme spielen oft in...', a:['LA','New York','Chicago','Texas'], c:1, d:2, f:'Pures NY-Streetfeel.' },
    { q:'"Aftersun" Regie?', a:['Song','Wells','Hansen-Løve','Reichardt'], c:1, d:2, f:'Charlotte Wells.' },
    { q:'"Past Lives" Regie?', a:['Wells','Song','Kogonada','Aster'], c:1, d:2, f:'Celine Song.' },
    { q:'Van Sant Film ohne Dialog?', a:['Idaho','Gerry','Elephant','Milk'], c:1, d:3, f:'Gerry.' },
    { q:'"Tangerine" Kamera?', a:['iPhone 5S','GoPro','DSLR','Red'], c:0, d:2, f:'iPhone pur.' },
    { q:'"Florida Project" Regie?', a:['Baker','Safdie','Aster','Linklater'], c:0, d:2, f:'Sean Baker.' },
    { q:'Kelly Reichardt Stil?', a:['Fast','Slow Cinema','Action','Found Footage'], c:1, d:3, f:'Slow Cinema.' },
    { q:'"Parasite" Studio?', a:['CJ / Barunson','A24','Neon','Lotte'], c:0, d:3, f:'Südkorea.' },
    { q:'"Minari" Hauptsprache?', a:['Englisch','Koreanisch','Beides','Spanisch'], c:1, d:2, f:'Koreanisch.' },
    { q:'Wer spielt in "The Lighthouse"?', a:['Pattinson & Dafoe','Hardy & Isaac','Damon & Wahlberg','Cruise & Pitt'], c:0, d:1, f:'Zwei Leuchtturmwärter.' },
    { q:'"Saint Maud" Genre?', a:['Rom-Com','Horror','Sci-Fi','Drama'], c:1, d:2, f:'Psychologischer Horror.' },
  ],
  
  // --- NEUE KATEGORIEN (Je 3 Beispiel-Fragen, erweiterbar auf 15) ---
  series: [
    { q:'Wer spielt Heisenberg in Breaking Bad?', a:['Bryan Cranston','Aaron Paul','Bob Odenkirk','Giancarlo Esposito'], c:0, d:1, f:'Bryan Cranston machte Walter White unsterblich.' },
    { q:'Wie heißt die Hauptfamilie in "The Sopranos"?', a:['Corleone','Soprano','Moltisanti','Gualtieri'], c:1, d:1, f:'Tony Soprano revolutionierte die Fernsehgeschichte.' },
    { q:'Welche Farbe haben die Anzüge der Wächter in "Squid Game"?', a:['Blau','Pink/Rot','Grün','Gelb'], c:1, d:1, f:'Die gruseligen Wärter tragen knallige Farben.' }
  ],
  animation: [
    { q:'Welches Miyazaki-Meisterwerk gewann einen Oscar?', a:['Prinzessin Mononoke','Chihiros Reise ins Zauberland','Mein Nachbar Totoro','Das wandelnde Schloss'], c:1, d:2, f:'Spirited Away gewann 2003.' },
    { q:'Welcher Pixar-Film spielt primär im Kopf eines Mädchens?', a:['Soul','Up','Inside Out','Coco'], c:2, d:1, f:'Alles steht Kopf visualisiert Emotionen großartig.' },
    { q:'Wer ist der Erzengel der Spider-Verse Filme?', a:['Peter Parker','Miles Morales','Miguel O’Hara','Gwen Stacy'], c:1, d:1, f:'Miles Morales bringt unglaublichen Style.' }
  ],
  superhero: [
    { q:'Wer führte Regie bei "The Dark Knight"?', a:['Zack Snyder','Christopher Nolan','Tim Burton','Matt Reeves'], c:1, d:1, f:'Nolan veränderte das Genre für immer.' },
    { q:'Welcher Marvel-Film hatte als erster über 2 Milliarden Dollar Einspiel?', a:['Avengers','Infinity War','Endgame','Black Panther'], c:1, d:2, f:'Infinity War war ein massiver Meilenstein.' },
    { q:'Wer spielte in "Joker" (2019) die Hauptrolle?', a:['Heath Ledger','Jared Leto','Joaquin Phoenix','Jack Nicholson'], c:2, d:1, f:'Phoenix gewann dafür den Oscar.' }
  ],
  oscars: [
    { q:'Welcher Film gewann die meisten Oscars (11)?', a:['Titanic','Ben-Hur','Lord of the Rings 3','Alle drei'], c:3, d:2, f:'Alle drei halten den Rekord mit je 11 Oscars.' },
    { q:'Wer hat die meisten Oscars für "Beste Regie"?', a:['Steven Spielberg','John Ford','Katharine Hepburn','Walt Disney'], c:1, d:3, f:'John Ford hat 4 Oscars für Regie.' },
    { q:'Welcher fremdsprachige Film gewann als erster "Best Picture"?', a:['Roma','Parasite','Amelie','Life is Beautiful'], c:1, d:1, f:'Parasite schrieb 2020 Geschichte.' }
  ],
  german: [
    { q:'Welcher Film gewann den Oscar für den besten fremdsprachigen Film 2023?', a:['Lola rennt','Das weiße Band','Im Westen nichts Neues','Toni Erdmann'], c:2, d:1, f:'Im Westen Nichts Neues.' },
    { q:'Wer führte Regie bei "Victoria" (One-Shot Film)?', a:['Fatih Akin','Tom Tykwer','Sebastian Schipper','Christian Petzold'], c:2, d:2, f:'Schipper drehte in einem einzigen Take.' },
    { q:'Wie heißt die erste deutsche Netflix-Originalserie?', a:['How to Sell Drugs Online','Dark','Babylon Berlin','Kleo'], c:1, d:1, f:'Dark ist ein globales Phänomen.' }
  ],
  comedy: [
    { q:'In welchem Film wird das "Ministerium für alberne Gänge" parodiert?', a:['Life of Brian','Holy Grail','Flying Circus','Meaning of Life'], c:2, d:2, f:'Monty Pythons Flying Circus war eine Serie, kein Film, aber absolut ikonisch.' },
    { q:'Wer stolpert in Kult-Filmen als "Der große Diktator"?', a:['Charlie Chaplin','Buster Keaton','Harold Lloyd','Marx Brothers'], c:0, d:1, f:'Chaplin verhöhnte Hitler mutig auf offener Leinwand.' },
    { q:'Welcher Film endet mit "Nobody is perfect"?', a:['Some Like It Hot','Airplane!','Annie Hall','Dumb and Dumber'], c:0, d:2, f:'Manche mögen\'s heiß.' }
  ],
  musical: [
    { q:'Wer inszenierte "La La Land"?', a:['Damien Chazelle','Rob Marshall','Baz Luhrmann','Steven Spielberg'], c:0, d:1, f:'Chazelle kombinierte Jazz mit klassischem Hollywood-Feeling.' },
    { q:'Welcher Song ist aus "Singin\' in the Rain"?', a:['Good Morning','My Favorite Things','America','Memory'], c:0, d:2, f:'Good Morning ist ein Klassiker.' },
    { q:'Welches Hit-Musical verfilmte Lin-Manuel Miranda?', a:['In the Heights','Rent','Tick Tick Boom','Hamilton'], c:0, d:3, f:'In the Heights wurde adaptiert, Hamilton wurde als Stage-Film veröffentlicht.' }
  ],
  scifi: [
    { q:'"Tears in rain" ist ein berühmtes Zitat aus...', a:['Terminator 2','Matrix','Blade Runner','Alien'], c:2, d:1, f:'Roy Battys Monolog wurde stark improvisiert.' },
    { q:'Welches Jahr ist der Titel von Kubricks Sci-Fi-Epos?', a:['1984','2001','2010','3000'], c:1, d:1, f:'2001: A Space Odyssey.' },
    { q:'Wer führte Regie bei "Arrival"?', a:['Ridley Scott','Denis Villeneuve','Christopher Nolan','James Cameron'], c:1, d:1, f:'Villeneuve schuf ein ruhiges Sci-Fi-Meisterwerk über Sprache.' }
  ],
  nineties: [
    { q:'"Pulp Fiction" stammt aus dem Jahr?', a:['1992','1994','1995','1996'], c:1, d:1, f:'1994 war eines der besten Kinojahre.' },
    { q:'Die erste Regel des Fight Clubs lautet?', a:['Gewinnen','Wir reden nicht über den Fight Club','Keine Hemden','Nur zwei pro Kampf'], c:1, d:1, f:'Du verlierst kein Wort darüber.' },
    { q:'"Matrix" (1999) hat welche dominierende Farbpalette?', a:['Rot/Blau','Grau','Grün','Neonpink'], c:2, d:1, f:'Die "Matrix"-Szenen sind stark grün getönt.' }
  ],
  worldcinema: [
    { q:'"Die fabelhafte Welt der Amélie" spielt in...', a:['London','Paris','Marseille','Lyon'], c:1, d:1, f:'Ein romantisiertes Montmartre in Paris.' },
    { q:'"Stadt der Gottes" (City of God) wurde in welchem Land gedreht?', a:['Spanien','Kolumbien','Mexiko','Brasilien'], c:3, d:1, f:'Brasilien, in den Favelas von Rio.' },
    { q:'Wer führte Regie beim mexikanischen Film "Roma"?', a:['Guillermo del Toro','Alfonso Cuarón','Alejandro G. Iñárritu','Carlos Reygadas'], c:1, d:1, f:'Cuarón gewann den Oscar für beste Regie.' }
  ]
};
