import type { Language } from "./i18n";

/** A question, its answer and, for Enigm questions, a link to enigm.io. */
export type FaqItem = [string, string, string?];

/** Frequently asked questions for the How it works page. */
export const faq: Record<Language, FaqItem[]> = {
  es: [
    [
      "¿Enigm Scan es gratis de verdad o tiene algún coste oculto?",
      "Es gratis de verdad. No te pedimos cuenta, correo electrónico ni tarjeta, y no hay funciones de pago escondidas ni límite de análisis: puedes revisar tus móviles tantas veces como quieras. Enigm Scan es un proyecto de código abierto de Enigm, la empresa suiza de privacidad que también desarrolla mensajería y llamadas privadas. Lo ofrecemos gratis porque comprobar si te espían no debería depender de lo que puedas pagar.",
    ],
    [
      "¿Qué necesito para poder analizar mi móvil?",
      "Un ordenador: un Mac con macOS 13 o posterior, o un PC con Windows o Linux. También tu móvil, iPhone o Android, y un cable USB que transmita datos; algunos cables baratos solo sirven para cargar y el ordenador no verá el móvil con ellos. Si analizas un iPhone desde Windows, instala antes la app Apple Devices de Microsoft Store; en Linux necesitas usbmuxd, que la mayoría de distribuciones ya incluyen. No hace falta instalar nada más: Enigm Scan se abre directamente desde el archivo descargado.",
    ],
    [
      "¿Mis datos o los de mi móvil salen en algún momento de mi ordenador?",
      "No. Todo ocurre en tu ordenador: la copia del móvil, el análisis y el informe. La copia es temporal y se borra al cerrar la app, y en iPhone ni siquiera copiamos tus fotos ni tus vídeos. Lo único que la app descarga de internet son las listas de indicadores de spyware, firmadas digitalmente para que nadie pueda alterarlas por el camino. Nunca enviamos a Enigm ni a nadie nada sobre ti, tu móvil o el resultado.",
    ],
    [
      "¿Qué busca exactamente Enigm Scan dentro de mi móvil?",
      "Busca rastros que dejan familias de spyware conocidas, como Pegasus, Predator o Candiru, y de las apps de stalkerware que se usan para espiar a una pareja o a un familiar: dominios a los que se conectan, procesos y archivos que instalan, perfiles y configuraciones que modifican. Son más de 11.000 indicadores documentados en investigaciones forenses públicas, y los comparamos con los mensajes, el historial de navegación, las apps, los procesos y la configuración de tu móvil. Para ello usamos MVT, el motor forense de código abierto que emplean investigadores de seguridad de todo el mundo. Además, en Android detecta apps que se comportan como spyware aunque todavía no estén documentadas, y en todos los móviles busca enlaces que imitan a servicios conocidos. Aun así, ningún análisis puede garantizar que encuentre un ataque completamente nuevo.",
    ],
    [
      "¿Detecta las apps espía que alguien cercano puede haber instalado?",
      "Sí. Además del spyware de alto nivel, buscamos stalkerware: apps comerciales que una pareja, un familiar o un conocido instala a escondidas para leer mensajes, ver la ubicación o escuchar llamadas. Las reconocemos por su nombre de paquete, por la huella de su archivo de instalación y por los servidores a los que se conectan, con la lista pública de Echap. En Android también avisamos de apps que se ocultan y reúnen permisos de espionaje, aunque no estén en ninguna lista. Las apps de control parental o de compartir ubicación salen como puntos a revisar, porque a veces se instalan a sabiendas.",
    ],
    [
      "¿Cuánto tiempo tarda un análisis completo?",
      "Depende sobre todo de cuántos datos tenga tu móvil y de la velocidad del cable. Un iPhone muy lleno puede tardar alrededor de una hora en copiarse y otra en analizarse; un móvil con poco contenido termina bastante antes. Durante todo el proceso ves el progreso real que informa el propio móvil y una estimación del tiempo restante. Puedes seguir usando el ordenador mientras tanto y cancelar en cualquier momento; solo procura no desconectar el móvil hasta que termine la copia.",
    ],
    [
      "¿Por qué el iPhone me pide «Confiar», mi código o una contraseña de copia?",
      "Son las medidas de seguridad del propio iPhone, no de Enigm Scan. «Confiar» y tu código autorizan que este ordenador pueda hacer una copia del móvil; el código lo escribes en la pantalla del iPhone y nosotros nunca lo vemos. Si alguna vez activaste las copias de seguridad cifradas, el iPhone las cifra con una contraseña propia, distinta de la de tu Apple ID, y te la pediremos para poder leer la copia. Esa contraseña se usa solo durante el análisis y no se guarda en ningún sitio.",
    ],
    [
      "¿Qué es el análisis profundo del iPhone y es obligatorio?",
      "Es una opción que puedes marcar antes de empezar. Justo después de «Confiar», te pedimos pulsar a la vez los tres botones que te marcamos y soltarlos al notar la vibración. El iPhone genera entonces un registro de diagnóstico y la copia empieza en cuanto lo confirma. De ese registro solo leemos los informes de fallos y el registro de apagado, donde spyware como Pegasus ha dejado huella, y el resto se borra. No mantengas los botones pulsados, porque llamarías a emergencias. Si no lo marcas, o pulsas «Seguir sin análisis profundo», el análisis sigue igual.",
    ],
    [
      "¿Cómo activo la depuración USB en mi móvil Android?",
      "Abre Ajustes › Información del teléfono y toca siete veces seguidas «Número de compilación» hasta que aparezca el aviso de que ya eres desarrollador; en algunos móviles está dentro de «Información de software». Vuelve a Ajustes, entra en «Opciones de desarrollador» y activa «Depuración USB». Al conectar el cable, el móvil te preguntará si quieres permitir la depuración desde este ordenador: acéptalo. Cuando termines el análisis puedes desactivar la depuración USB y revocar las autorizaciones desde ese mismo menú.",
    ],
    [
      "Si el resultado sale limpio, ¿significa que nadie me está espiando?",
      "Significa que no hemos encontrado rastros de ninguno de los spyware conocidos en los datos que revisamos, y eso ya es una comprobación seria. Pero ningún análisis puede garantizar al 100 % que un móvil está limpio: un ataque nuevo, aún sin documentar, o uno que haya borrado sus huellas podría pasar desapercibido. Si sigues teniendo motivos para sospechar, repite el análisis más adelante, cuando las listas de indicadores se hayan actualizado, o consulta con un especialista.",
    ],
    [
      "¿Qué diferencia hay entre un indicio y un punto a revisar?",
      "Un indicio es algo que coincide con spyware conocido, como un dominio, una app o un archivo publicados por investigadores, o una app que combina ocultarse con funciones de espionaje. Un punto a revisar es un ajuste o una app poco habitual que no coincide con nada conocido y que también aparece en móviles sin infectar, como una app instalada fuera de una tienda o un proxy de red. Solo los indicios cambian el resultado del análisis. Ante un punto a revisar, comprueba si lo reconoces; si no, consulta con un especialista.",
    ],
    [
      "¿Qué debo hacer si el análisis encuentra indicios de spyware?",
      "Lo primero, mantener la calma: un indicio es una señal que merece revisión, no la confirmación de una infección. No borres nada, no actualices ni restaures el móvil, porque podrías destruir las pruebas que un experto necesita. Descarga el informe en PDF y guárdalo en un lugar seguro. Después, contacta con un especialista en seguridad digital; si eres periodista, activista o trabajas en la sociedad civil, la línea de ayuda gratuita de Access Now puede orientarte.",
    ],
    [
      "¿Puedo analizar el móvil de otra persona?",
      "Solo si es tuyo o si su dueño te ha dado permiso de forma explícita. Antes de empezar te pedimos confirmarlo, porque revisar el móvil de otra persona sin su consentimiento puede vulnerar su intimidad y, en muchos países, ser ilegal. Si quieres ayudar a alguien a revisar su móvil, hazlo con esa persona delante y con su acuerdo.",
    ],
    [
      "¿Cómo puedo protegerme de este tipo de ataques?",
      "Empieza por lo básico: mantén el móvil siempre actualizado, reinícialo con frecuencia y, si estás en riesgo, activa el Modo de Aislamiento del iPhone. Después, protege lo que más interesa a quien espía: tus conversaciones. Con Enigm, tus mensajes y llamadas viajan cifrados de extremo a extremo, puedes crear tu cuenta sin correo ni número de teléfono y la app se protege contra manipulaciones y dispositivos comprometidos. Además, Active Defense analiza tu móvil y su comportamiento de red en busca de spyware, sin inspeccionar tus comunicaciones protegidas.",
      "Descubre Enigm en enigm.io",
    ],
    [
      "¿Qué es Enigm y qué ofrece además de Enigm Scan?",
      "Enigm es una empresa suiza de privacidad que crea herramientas para comunicarte y moverte con seguridad. Su app principal ofrece mensajería y llamadas cifradas de extremo a extremo, y con Enigm Server tu equipo puede tener su propio entorno de mensajería privado. Para el día a día también están Enigm eSIM, conectividad móvil solo de datos que puedes contratar sin verificación de identidad, y Enigm Gateway, un router diseñado para proteger tu red con VPN cifrada y protección DNS. Todo se gestiona desde Enigm Command.",
      "Descubre Enigm en enigm.io",
    ],
    [
      "¿Y si necesito un móvil o un ordenador más protegido?",
      "Enigm OS es una plataforma de dispositivo segura, disponible en el Fairphone 6, que reduce la superficie de ataque, verifica sus actualizaciones y te da control sobre la red, el DNS y la privacidad del dispositivo. Para trabajar desde cualquier ordenador está Enigm Link, un USB sellado con apps para macOS, Windows y Linux que abre un entorno protegido solo después de validar el dispositivo y activar la VPN. Y para emergencias, Enigm Key es un dispositivo físico que envía una alerta SOS cifrada a tus contactos con solo pulsar un botón, sin desbloquear el móvil.",
      "Descubre Enigm en enigm.io",
    ],
  ],
  en: [
    [
      "Is Enigm Scan really free, or is there a hidden cost?",
      "It really is free. We don’t ask for an account, an email address or a card, and there are no hidden paid features or scan limits: you can check your phones as often as you like. Enigm Scan is an open-source project by Enigm, the Swiss privacy company that also builds private messaging and calls. We offer it for free because finding out whether you’re being spied on shouldn’t depend on what you can afford.",
    ],
    [
      "What do I need to be able to scan my phone?",
      "A computer: a Mac with macOS 13 or later, or a PC with Windows or Linux. You also need your phone, iPhone or Android, and a USB cable that carries data; some cheap cables only charge, and the computer won’t see the phone with them. If you scan an iPhone from Windows, first install the Apple Devices app from the Microsoft Store; on Linux you need usbmuxd, which most distributions already include. Nothing else needs installing: Enigm Scan opens straight from the downloaded file.",
    ],
    [
      "Does my data, or my phone’s data, ever leave my computer?",
      "No. Everything happens on your computer: the phone copy, the analysis and the report. The copy is temporary and deleted when you close the app, and on iPhone we don’t even copy your photos or videos. The only thing the app downloads from the internet is the spyware indicator lists, digitally signed so nobody can tamper with them on the way. We never send Enigm or anyone else anything about you, your phone or the result.",
    ],
    [
      "What exactly does Enigm Scan look for on my phone?",
      "It looks for the traces left by known spyware families such as Pegasus, Predator or Candiru, and by the stalkerware apps used to spy on a partner or relative: domains they connect to, processes and files they install, profiles and settings they change. That’s more than 11,000 indicators documented in public forensic investigations, compared against your phone’s messages, browsing history, apps, processes and settings. We use MVT, the open-source forensic engine used by security researchers around the world. On Android it also detects apps that behave like spyware even before they are documented, and on every phone it looks for links that imitate well-known services. Even so, no scan can guarantee it will catch a brand-new attack.",
    ],
    [
      "Does it detect spy apps that someone close to me may have installed?",
      "Yes. Besides high-end spyware, we look for stalkerware: commercial apps that a partner, relative or acquaintance installs secretly to read messages, see your location or listen to calls. We recognise them by their package name, by the fingerprint of their install file and by the servers they connect to, using Echap’s public list. On Android we also flag apps that hide and gather spying permissions, even if they are on no list. Parental control and location sharing apps appear as points to review, because they are sometimes installed knowingly.",
    ],
    [
      "How long does a full scan take?",
      "It mainly depends on how much data your phone holds and on the cable’s speed. A very full iPhone can take about an hour to copy and another to analyse; a phone with little content finishes much sooner. Throughout, you see the real progress reported by the phone itself and an estimate of the time left. You can keep using your computer meanwhile and cancel at any time; just try not to unplug the phone until the copy has finished.",
    ],
    [
      "Why does my iPhone ask for “Trust”, my passcode or a backup password?",
      "These are the iPhone’s own safeguards, not Enigm Scan’s. “Trust” and your passcode authorise this computer to make a copy of the phone; you type the passcode on the iPhone’s screen and we never see it. If you ever turned on encrypted backups, the iPhone protects them with a separate password, different from your Apple ID, and we’ll ask for it so the copy can be read. That password is only used during the scan and is never stored.",
    ],
    [
      "What is the iPhone deep check and is it required?",
      "It is an option you can tick before you start. Right after “Trust”, we ask you to press the three buttons we mark at the same time and release them when you feel the vibration. The iPhone then creates a diagnostic log, and the copy starts as soon as it confirms. From that log we only read the crash reports and the shutdown log, where spyware such as Pegasus has left traces, and the rest is deleted. Don’t hold the buttons, or you will call emergency services. If you leave it unticked, or choose “Continue without the deep check”, the scan carries on as usual.",
    ],
    [
      "How do I turn on USB debugging on my Android phone?",
      "Open Settings › About phone and tap “Build number” seven times in a row until a message says you’re now a developer; on some phones it sits under “Software information”. Go back to Settings, open “Developer options” and turn on “USB debugging”. When you plug in the cable, the phone will ask whether to allow debugging from this computer: accept it. Once the scan is over, you can turn USB debugging off and revoke the authorisations from the same menu.",
    ],
    [
      "If the result is clean, does it mean nobody is spying on me?",
      "It means we found no traces of any known spyware in the data we checked, which is already a serious check. But no scan can guarantee 100% that a phone is clean: a new, undocumented attack, or one that has wiped its tracks, could go unnoticed. If you still have reasons to be suspicious, run the scan again later, once the indicator lists have been updated, or talk to a specialist.",
    ],
    [
      "What is the difference between a finding and a point to review?",
      "A finding matches known spyware, such as a domain, app or file published by researchers, or an app that combines hiding with spying features. A point to review is an unusual setting or app that matches nothing known and also shows up on phones that are not infected, such as an app installed outside a store or a network proxy. Only findings change the result of the scan. For a point to review, check whether you recognise it; if not, ask a specialist.",
    ],
    [
      "What should I do if the scan finds signs of spyware?",
      "First, stay calm: a sign is something worth reviewing, not proof of an infection. Don’t delete anything, and don’t update or reset the phone, as you could destroy the evidence an expert needs. Download the PDF report and keep it somewhere safe. Then contact a digital security specialist; if you’re a journalist, an activist or work in civil society, Access Now’s free Digital Security Helpline can guide you.",
    ],
    [
      "Can I scan someone else’s phone?",
      "Only if it’s yours or its owner has given you explicit permission. We ask you to confirm this before starting, because checking another person’s phone without consent can violate their privacy and, in many countries, be illegal. If you want to help someone check their phone, do it with them present and with their agreement.",
    ],
    [
      "How can I protect myself against these attacks?",
      "Start with the basics: keep your phone up to date, restart it often and, if you’re at risk, turn on iPhone’s Lockdown Mode. Then protect what spies want most: your conversations. With Enigm, your messages and calls are end-to-end encrypted, you can create your account without an email or phone number, and the app defends itself against tampering and compromised devices. Active Defense also analyses your phone and its network behaviour for spyware, without inspecting your protected communications.",
      "Discover Enigm at enigm.io",
    ],
    [
      "What is Enigm, and what does it offer besides Enigm Scan?",
      "Enigm is a Swiss privacy company building tools to communicate and move around safely. Its main app offers end-to-end encrypted messaging and calls, and with Enigm Server your team can run its own private messaging environment. For everyday use there’s also Enigm eSIM, data-only mobile connectivity you can buy without identity verification, and Enigm Gateway, a router designed to protect your network with encrypted VPN and DNS protection. Everything is managed from Enigm Command.",
      "Discover Enigm at enigm.io",
    ],
    [
      "What if I need a more secure phone or computer?",
      "Enigm OS is a secure device platform, available on the Fairphone 6, that reduces the attack surface, verifies its updates and gives you control over the device’s network, DNS and privacy. To work from any computer there’s Enigm Link, a sealed USB with apps for macOS, Windows and Linux that only opens a protected environment after validating the device and enforcing the VPN. And for emergencies, Enigm Key is a physical device that sends an encrypted SOS alert to your contacts at the press of a button, without unlocking your phone.",
      "Discover Enigm at enigm.io",
    ],
  ],
  fr: [
    [
      "Enigm Scan est-il vraiment gratuit, ou y a-t-il un coût caché ?",
      "Il est vraiment gratuit. Nous ne demandons ni compte, ni adresse e-mail, ni carte, et il n’y a ni fonctions payantes cachées ni limite d’analyses : vous pouvez vérifier vos téléphones aussi souvent que vous le souhaitez. Enigm Scan est un projet open source d’Enigm, l’entreprise suisse de confidentialité qui développe aussi une messagerie et des appels privés. Nous l’offrons gratuitement parce que savoir si l’on vous espionne ne devrait pas dépendre de vos moyens.",
    ],
    [
      "De quoi ai-je besoin pour analyser mon téléphone ?",
      "D’un ordinateur : un Mac sous macOS 13 ou plus récent, ou un PC sous Windows ou Linux. Il vous faut aussi votre téléphone, iPhone ou Android, et un câble USB qui transmet des données ; certains câbles bon marché ne font que charger et l’ordinateur ne verra pas le téléphone. Pour analyser un iPhone sous Windows, installez d’abord l’app Apple Devices depuis le Microsoft Store ; sous Linux, il faut usbmuxd, déjà inclus dans la plupart des distributions. Rien d’autre à installer : Enigm Scan s’ouvre directement depuis le fichier téléchargé.",
    ],
    [
      "Mes données, ou celles de mon téléphone, quittent-elles mon ordinateur ?",
      "Non. Tout se passe sur votre ordinateur : la copie du téléphone, l’analyse et le rapport. La copie est temporaire et supprimée à la fermeture de l’app, et sur iPhone nous ne copions même pas vos photos ni vos vidéos. La seule chose que l’app télécharge sur internet, ce sont les listes d’indicateurs de logiciels espions, signées numériquement pour que personne ne puisse les modifier en chemin. Nous n’envoyons jamais rien à Enigm ni à personne sur vous, votre téléphone ou le résultat.",
    ],
    [
      "Que recherche exactement Enigm Scan dans mon téléphone ?",
      "Les traces laissées par des familles de logiciels espions connues comme Pegasus, Predator ou Candiru, et par les applications de stalkerware utilisées pour espionner un conjoint ou un proche : domaines contactés, processus et fichiers installés, profils et réglages modifiés. Plus de 11 000 indicateurs documentés dans des enquêtes forensiques publiques, comparés aux messages, à l’historique de navigation, aux apps, aux processus et aux réglages de votre téléphone. Nous utilisons MVT, le moteur forensique open source employé par des chercheurs en sécurité du monde entier. Sur Android, il détecte aussi les applications qui se comportent comme des logiciels espions avant même qu’elles soient documentées, et sur tous les téléphones il repère les liens qui imitent des services connus. Aucune analyse ne peut toutefois garantir de trouver une attaque toute nouvelle.",
    ],
    [
      "Détecte-t-il les applications espionnes qu’un proche a pu installer ?",
      "Oui. En plus des logiciels espions de haut niveau, nous cherchons les stalkerwares : des applications commerciales qu’un conjoint, un parent ou une connaissance installe en cachette pour lire les messages, voir la position ou écouter les appels. Nous les reconnaissons à leur nom de paquet, à l’empreinte de leur fichier d’installation et aux serveurs qu’elles contactent, grâce à la liste publique d’Echap. Sur Android, nous signalons aussi les applications qui se cachent et cumulent des autorisations d’espionnage, même absentes de toute liste. Les applications de contrôle parental ou de partage de position apparaissent comme points à vérifier, car elles sont parfois installées en connaissance de cause.",
    ],
    [
      "Combien de temps dure une analyse complète ?",
      "Cela dépend surtout de la quantité de données du téléphone et de la vitesse du câble. Un iPhone très rempli peut prendre environ une heure à copier et une autre à analyser ; un téléphone peu rempli termine bien plus tôt. Pendant tout le processus, vous voyez la progression réelle indiquée par le téléphone et une estimation du temps restant. Vous pouvez continuer à utiliser l’ordinateur et annuler à tout moment ; évitez seulement de débrancher le téléphone avant la fin de la copie.",
    ],
    [
      "Pourquoi mon iPhone demande-t-il « Se fier », mon code ou un mot de passe de sauvegarde ?",
      "Ce sont les protections de l’iPhone lui-même, pas celles d’Enigm Scan. « Se fier » et votre code autorisent cet ordinateur à faire une copie du téléphone ; vous saisissez le code sur l’écran de l’iPhone et nous ne le voyons jamais. Si vous avez activé les sauvegardes chiffrées, l’iPhone les protège avec un mot de passe distinct de celui de votre identifiant Apple, et nous vous le demanderons pour lire la copie. Ce mot de passe ne sert que pendant l’analyse et n’est jamais conservé.",
    ],
    [
      "Qu’est-ce que l’analyse approfondie de l’iPhone et est-elle obligatoire ?",
      "C’est une option que vous pouvez cocher avant de commencer. Juste après « Se fier », nous vous demandons d’appuyer en même temps sur les trois boutons indiqués et de les relâcher à la vibration. L’iPhone crée alors un journal de diagnostic, et la copie commence dès qu’il le confirme. Nous n’en lisons que les rapports de plantage et le journal d’arrêt, où des logiciels espions comme Pegasus ont laissé des traces, et le reste est supprimé. Ne maintenez pas les boutons, sinon vous appelleriez les urgences. Si vous ne la cochez pas, ou choisissez « Continuer sans l’analyse approfondie », l’analyse continue normalement.",
    ],
    [
      "Comment activer le débogage USB sur mon téléphone Android ?",
      "Ouvrez Paramètres › À propos du téléphone et touchez sept fois de suite « Numéro de build » jusqu’au message indiquant que vous êtes développeur ; sur certains téléphones, il se trouve dans « Informations sur le logiciel ». Revenez aux Paramètres, ouvrez « Options pour les développeurs » et activez « Débogage USB ». En branchant le câble, le téléphone vous demandera d’autoriser le débogage depuis cet ordinateur : acceptez. Après l’analyse, vous pouvez désactiver le débogage USB et révoquer les autorisations depuis ce même menu.",
    ],
    [
      "Si le résultat est propre, cela veut-il dire que personne ne m’espionne ?",
      "Cela signifie que nous n’avons trouvé aucune trace de logiciel espion connu dans les données examinées, ce qui est déjà une vérification sérieuse. Mais aucune analyse ne peut garantir à 100 % qu’un téléphone est sain : une attaque nouvelle, pas encore documentée, ou qui a effacé ses traces, pourrait passer inaperçue. Si vous avez toujours des raisons de vous méfier, refaites l’analyse plus tard, une fois les listes d’indicateurs mises à jour, ou consultez un spécialiste.",
    ],
    [
      "Quelle différence entre un signal et un point à vérifier ?",
      "Un signal correspond à un logiciel espion connu, comme un domaine, une application ou un fichier publiés par des chercheurs, ou une application qui combine dissimulation et fonctions d’espionnage. Un point à vérifier est un réglage ou une application inhabituels qui ne correspondent à rien de connu et apparaissent aussi sur des téléphones sains, comme une application installée hors boutique ou un proxy réseau. Seuls les signaux changent le résultat de l’analyse. Pour un point à vérifier, regardez si vous le reconnaissez ; sinon, consultez un spécialiste.",
    ],
    [
      "Que faire si l’analyse trouve des signes de logiciel espion ?",
      "D’abord, restez calme : un signe mérite un examen, ce n’est pas la preuve d’une infection. Ne supprimez rien, ne mettez pas à jour et ne réinitialisez pas le téléphone, vous pourriez détruire les preuves dont un expert a besoin. Téléchargez le rapport PDF et conservez-le en lieu sûr. Contactez ensuite un spécialiste de la sécurité numérique ; si vous êtes journaliste, militant ou membre de la société civile, la ligne d’assistance gratuite d’Access Now peut vous orienter.",
    ],
    [
      "Puis-je analyser le téléphone de quelqu’un d’autre ?",
      "Seulement s’il vous appartient ou si son propriétaire vous a donné son accord explicite. Nous vous demandons de le confirmer avant de commencer, car examiner le téléphone d’une autre personne sans son consentement peut porter atteinte à sa vie privée et, dans de nombreux pays, être illégal. Si vous voulez aider quelqu’un à vérifier son téléphone, faites-le en sa présence et avec son accord.",
    ],
    [
      "Comment me protéger contre ce type d’attaques ?",
      "Commencez par l’essentiel : gardez votre téléphone à jour, redémarrez-le souvent et, si vous êtes exposé, activez le mode Isolement de l’iPhone. Protégez ensuite ce qui intéresse le plus ceux qui espionnent : vos conversations. Avec Enigm, vos messages et appels sont chiffrés de bout en bout, vous pouvez créer votre compte sans e-mail ni numéro de téléphone, et l’app se protège contre les manipulations et les appareils compromis. Active Defense analyse aussi votre téléphone et son comportement réseau à la recherche de logiciels espions, sans inspecter vos communications protégées.",
      "Découvrez Enigm sur enigm.io",
    ],
    [
      "Qu’est-ce qu’Enigm et que propose-t-il en plus d’Enigm Scan ?",
      "Enigm est une entreprise suisse de confidentialité qui crée des outils pour communiquer et se déplacer en sécurité. Son app principale offre une messagerie et des appels chiffrés de bout en bout, et avec Enigm Server votre équipe peut disposer de son propre environnement de messagerie privé. Au quotidien, il y a aussi Enigm eSIM, une connectivité mobile data seule que vous pouvez acheter sans vérification d’identité, et Enigm Gateway, un routeur conçu pour protéger votre réseau avec un VPN chiffré et une protection DNS. Tout se gère depuis Enigm Command.",
      "Découvrez Enigm sur enigm.io",
    ],
    [
      "Et si j’ai besoin d’un téléphone ou d’un ordinateur plus sûr ?",
      "Enigm OS est une plateforme d’appareil sécurisée, disponible sur le Fairphone 6, qui réduit la surface d’attaque, vérifie ses mises à jour et vous donne le contrôle du réseau, du DNS et de la confidentialité de l’appareil. Pour travailler depuis n’importe quel ordinateur, il y a Enigm Link, une clé USB scellée avec des apps pour macOS, Windows et Linux qui n’ouvre un environnement protégé qu’après avoir validé l’appareil et activé le VPN. Et en cas d’urgence, Enigm Key est un appareil physique qui envoie une alerte SOS chiffrée à vos contacts d’une simple pression, sans déverrouiller le téléphone.",
      "Découvrez Enigm sur enigm.io",
    ],
  ],
  de: [
    [
      "Ist Enigm Scan wirklich kostenlos, oder gibt es versteckte Kosten?",
      "Es ist wirklich kostenlos. Wir verlangen kein Konto, keine E-Mail-Adresse und keine Karte, und es gibt weder versteckte Bezahlfunktionen noch ein Analyse-Limit: Sie können Ihre Smartphones so oft prüfen, wie Sie möchten. Enigm Scan ist ein Open-Source-Projekt von Enigm, dem Schweizer Datenschutzunternehmen, das auch private Nachrichten und Anrufe entwickelt. Wir bieten es kostenlos an, weil die Frage, ob man ausspioniert wird, nicht vom Geldbeutel abhängen sollte.",
    ],
    [
      "Was brauche ich, um mein Smartphone zu analysieren?",
      "Einen Computer: einen Mac mit macOS 13 oder neuer oder einen PC mit Windows oder Linux. Dazu Ihr Smartphone, iPhone oder Android, und ein USB-Kabel, das Daten überträgt; manche günstigen Kabel laden nur, und dann erkennt der Computer das Smartphone nicht. Für ein iPhone unter Windows installieren Sie zuerst die App Apple Devices aus dem Microsoft Store; unter Linux brauchen Sie usbmuxd, das die meisten Distributionen bereits mitbringen. Sonst ist nichts zu installieren: Enigm Scan startet direkt aus der heruntergeladenen Datei.",
    ],
    [
      "Verlassen meine Daten oder die meines Smartphones jemals meinen Computer?",
      "Nein. Alles geschieht auf Ihrem Computer: die Kopie des Smartphones, die Analyse und der Bericht. Die Kopie ist vorübergehend und wird beim Schließen der App gelöscht, und beim iPhone kopieren wir nicht einmal Ihre Fotos oder Videos. Aus dem Internet lädt die App nur die Spyware-Indikatorlisten, digital signiert, damit sie unterwegs niemand verändern kann. Wir senden niemals etwas über Sie, Ihr Smartphone oder das Ergebnis an Enigm oder an Dritte.",
    ],
    [
      "Wonach sucht Enigm Scan genau auf meinem Smartphone?",
      "Nach Spuren bekannter Spyware-Familien wie Pegasus, Predator oder Candiru sowie von Stalkerware-Apps, mit denen Partner oder Angehörige ausspioniert werden: kontaktierte Domains, installierte Prozesse und Dateien, veränderte Profile und Einstellungen. Das sind mehr als 11.000 Indikatoren aus öffentlichen forensischen Untersuchungen, abgeglichen mit Nachrichten, Browserverlauf, Apps, Prozessen und Einstellungen Ihres Smartphones. Dafür nutzen wir MVT, die Open-Source-Forensik-Engine, die Sicherheitsforscher weltweit einsetzen. Auf Android erkennt es außerdem Apps, die sich wie Spyware verhalten, auch bevor sie dokumentiert sind, und auf allen Geräten sucht es nach Links, die bekannte Dienste nachahmen. Dennoch kann keine Analyse garantieren, einen ganz neuen Angriff zu finden.",
    ],
    [
      "Erkennt es Spionage-Apps, die jemand aus meinem Umfeld installiert haben könnte?",
      "Ja. Neben hochentwickelter Spyware suchen wir nach Stalkerware: kommerziellen Apps, die Partner, Angehörige oder Bekannte heimlich installieren, um Nachrichten zu lesen, den Standort zu sehen oder Anrufe mitzuhören. Wir erkennen sie am Paketnamen, am Fingerabdruck ihrer Installationsdatei und an den kontaktierten Servern, anhand der öffentlichen Liste von Echap. Auf Android melden wir außerdem Apps, die sich verstecken und Spionageberechtigungen bündeln, auch wenn sie auf keiner Liste stehen. Apps für Kinderschutz oder Standortfreigabe erscheinen als zu prüfende Punkte, da sie manchmal bewusst installiert werden.",
    ],
    [
      "Wie lange dauert eine vollständige Analyse?",
      "Das hängt vor allem von der Datenmenge auf dem Smartphone und der Geschwindigkeit des Kabels ab. Ein sehr volles iPhone kann etwa eine Stunde zum Kopieren und eine weitere zur Analyse brauchen; ein Smartphone mit wenig Inhalt ist deutlich schneller fertig. Während des ganzen Vorgangs sehen Sie den echten Fortschritt, den das Smartphone meldet, und eine Schätzung der Restzeit. Sie können den Computer weiter nutzen und jederzeit abbrechen; ziehen Sie das Smartphone nur nicht ab, bevor die Kopie fertig ist.",
    ],
    [
      "Warum fragt mein iPhone nach „Vertrauen“, meinem Code oder einem Backup-Passwort?",
      "Das sind Schutzmaßnahmen des iPhones selbst, nicht von Enigm Scan. „Vertrauen“ und Ihr Code erlauben diesem Computer, eine Kopie des Smartphones zu erstellen; den Code geben Sie auf dem iPhone-Bildschirm ein, wir sehen ihn nie. Wenn Sie verschlüsselte Backups aktiviert haben, schützt das iPhone sie mit einem eigenen Passwort, das sich von Ihrem Apple-Account unterscheidet, und wir fragen danach, um die Kopie lesen zu können. Dieses Passwort wird nur während der Analyse verwendet und nirgends gespeichert.",
    ],
    [
      "Was ist die Tiefenprüfung des iPhones und ist sie Pflicht?",
      "Das ist eine Option, die Sie vor dem Start auswählen können. Direkt nach „Vertrauen“ bitten wir Sie, die drei markierten Tasten gleichzeitig zu drücken und bei der Vibration loszulassen. Das iPhone erstellt dann ein Diagnoseprotokoll, und die Kopie beginnt, sobald es das bestätigt. Daraus lesen wir nur die Absturzberichte und das Ausschaltprotokoll, in denen Spyware wie Pegasus Spuren hinterlassen hat; der Rest wird gelöscht. Halten Sie die Tasten nicht gedrückt, sonst rufen Sie den Notruf an. Wenn Sie sie nicht auswählen oder „Ohne Tiefenprüfung fortfahren“ wählen, läuft die Analyse normal weiter.",
    ],
    [
      "Wie aktiviere ich USB-Debugging auf meinem Android-Smartphone?",
      "Öffnen Sie Einstellungen › Über das Telefon und tippen Sie siebenmal hintereinander auf „Build-Nummer“, bis eine Meldung bestätigt, dass Sie jetzt Entwickler sind; auf manchen Geräten steht sie unter „Softwareinformationen“. Gehen Sie zurück zu den Einstellungen, öffnen Sie die „Entwickleroptionen“ und aktivieren Sie „USB-Debugging“. Beim Anschließen fragt das Smartphone, ob Debugging von diesem Computer erlaubt werden soll: Bestätigen Sie das. Nach der Analyse können Sie USB-Debugging im selben Menü wieder ausschalten und die Autorisierungen widerrufen.",
    ],
    [
      "Wenn das Ergebnis sauber ist, heißt das, dass mich niemand ausspioniert?",
      "Es bedeutet, dass wir in den geprüften Daten keine Spuren bekannter Spyware gefunden haben, und das ist bereits eine ernsthafte Prüfung. Keine Analyse kann aber zu 100 % garantieren, dass ein Smartphone sauber ist: Ein neuer, noch nicht dokumentierter Angriff oder einer, der seine Spuren gelöscht hat, könnte unbemerkt bleiben. Wenn Sie weiterhin Grund zum Misstrauen haben, wiederholen Sie die Analyse später, sobald die Indikatorlisten aktualisiert wurden, oder wenden Sie sich an Fachleute.",
    ],
    [
      "Was ist der Unterschied zwischen einem Hinweis und einem zu prüfenden Punkt?",
      "Ein Hinweis entspricht bekannter Spyware, etwa einer von Forschern veröffentlichten Domain, App oder Datei, oder einer App, die Verstecken mit Spionagefunktionen verbindet. Ein zu prüfender Punkt ist eine ungewöhnliche Einstellung oder App, die nichts Bekanntem entspricht und auch auf nicht infizierten Geräten vorkommt, etwa eine außerhalb eines Stores installierte App oder ein Netzwerk-Proxy. Nur Hinweise ändern das Ergebnis der Analyse. Prüfen Sie bei einem Punkt, ob Sie ihn kennen; wenn nicht, wenden Sie sich an eine Fachperson.",
    ],
    [
      "Was soll ich tun, wenn die Analyse Hinweise auf Spyware findet?",
      "Zuerst: Ruhe bewahren. Ein Hinweis ist ein Anlass zur Prüfung, kein Beweis für eine Infektion. Löschen Sie nichts, aktualisieren Sie das Smartphone nicht und setzen Sie es nicht zurück, sonst könnten Sie Beweise vernichten, die Fachleute brauchen. Laden Sie den PDF-Bericht herunter und bewahren Sie ihn sicher auf. Wenden Sie sich dann an Fachleute für digitale Sicherheit; wenn Sie journalistisch, aktivistisch oder in der Zivilgesellschaft tätig sind, hilft Ihnen die kostenlose Digital Security Helpline von Access Now weiter.",
    ],
    [
      "Darf ich das Smartphone einer anderen Person analysieren?",
      "Nur wenn es Ihnen gehört oder der Besitzer ausdrücklich zugestimmt hat. Wir bitten Sie, das vor dem Start zu bestätigen, denn das Prüfen eines fremden Smartphones ohne Einwilligung kann die Privatsphäre verletzen und ist in vielen Ländern strafbar. Wenn Sie jemandem helfen möchten, sein Smartphone zu prüfen, tun Sie es gemeinsam mit dieser Person und mit ihrem Einverständnis.",
    ],
    [
      "Wie kann ich mich vor solchen Angriffen schützen?",
      "Beginnen Sie mit den Grundlagen: Halten Sie Ihr Smartphone aktuell, starten Sie es regelmäßig neu und aktivieren Sie bei erhöhtem Risiko den Blockierungsmodus des iPhones. Schützen Sie dann, was Spione am meisten interessiert: Ihre Gespräche. Mit Enigm sind Ihre Nachrichten und Anrufe Ende-zu-Ende-verschlüsselt, Sie können Ihr Konto ohne E-Mail oder Telefonnummer anlegen, und die App schützt sich vor Manipulation und kompromittierten Geräten. Active Defense analysiert zudem Ihr Smartphone und sein Netzwerkverhalten auf Spyware, ohne Ihre geschützte Kommunikation einzusehen.",
      "Enigm entdecken auf enigm.io",
    ],
    [
      "Was ist Enigm und was bietet es neben Enigm Scan?",
      "Enigm ist ein Schweizer Datenschutzunternehmen, das Werkzeuge für sichere Kommunikation und Mobilität entwickelt. Die Haupt-App bietet Ende-zu-Ende-verschlüsselte Nachrichten und Anrufe, und mit Enigm Server kann Ihr Team eine eigene private Messaging-Umgebung betreiben. Für den Alltag gibt es außerdem Enigm eSIM, reine Daten-Mobilfunkverbindung, die Sie ohne Identitätsprüfung kaufen können, und Enigm Gateway, einen Router, der Ihr Netzwerk mit verschlüsseltem VPN und DNS-Schutz absichert. Verwaltet wird alles über Enigm Command.",
      "Enigm entdecken auf enigm.io",
    ],
    [
      "Und wenn ich ein sichereres Smartphone oder einen sichereren Computer brauche?",
      "Enigm OS ist eine sichere Geräteplattform für das Fairphone 6, die die Angriffsfläche verkleinert, ihre Updates prüft und Ihnen die Kontrolle über Netzwerk, DNS und Datenschutz des Geräts gibt. Für die Arbeit an jedem Computer gibt es Enigm Link, einen versiegelten USB-Stick mit Apps für macOS, Windows und Linux, der eine geschützte Umgebung erst nach Geräteprüfung und aktivem VPN öffnet. Und für Notfälle sendet Enigm Key, ein physisches Gerät, per Knopfdruck einen verschlüsselten SOS-Alarm an Ihre Kontakte, ohne das Smartphone zu entsperren.",
      "Enigm entdecken auf enigm.io",
    ],
  ],
  it: [
    [
      "Enigm Scan è davvero gratis o ci sono costi nascosti?",
      "È davvero gratis. Non chiediamo account, email né carta, e non ci sono funzioni a pagamento nascoste né limiti di analisi: puoi controllare i tuoi telefoni tutte le volte che vuoi. Enigm Scan è un progetto open source di Enigm, l’azienda svizzera della privacy che sviluppa anche messaggistica e chiamate private. Lo offriamo gratis perché sapere se qualcuno ti spia non dovrebbe dipendere da quanto puoi spendere.",
    ],
    [
      "Di cosa ho bisogno per analizzare il mio telefono?",
      "Un computer: un Mac con macOS 13 o successivo, oppure un PC con Windows o Linux. Poi il tuo telefono, iPhone o Android, e un cavo USB che trasmetta dati; alcuni cavi economici servono solo a ricaricare e con quelli il computer non vede il telefono. Se analizzi un iPhone da Windows, installa prima l’app Apple Devices dal Microsoft Store; su Linux serve usbmuxd, già incluso nella maggior parte delle distribuzioni. Non serve installare altro: Enigm Scan si apre direttamente dal file scaricato.",
    ],
    [
      "I miei dati, o quelli del telefono, escono mai dal computer?",
      "No. Tutto avviene sul tuo computer: la copia del telefono, l’analisi e il rapporto. La copia è temporanea e viene cancellata quando chiudi l’app, e su iPhone non copiamo nemmeno foto e video. L’unica cosa che l’app scarica da internet sono le liste di indicatori di spyware, firmate digitalmente perché nessuno possa alterarle lungo il percorso. Non inviamo mai nulla su di te, sul telefono o sul risultato a Enigm o ad altri.",
    ],
    [
      "Cosa cerca esattamente Enigm Scan nel mio telefono?",
      "Cerca le tracce lasciate da famiglie di spyware note come Pegasus, Predator o Candiru, e dalle app di stalkerware usate per spiare un partner o un familiare: domini contattati, processi e file installati, profili e impostazioni modificati. Sono oltre 11.000 indicatori documentati in indagini forensi pubbliche, confrontati con messaggi, cronologia di navigazione, app, processi e impostazioni del telefono. Usiamo MVT, il motore forense open source utilizzato dai ricercatori di sicurezza di tutto il mondo. Su Android rileva anche le app che si comportano come spyware prima ancora che siano documentate, e su tutti i telefoni cerca i link che imitano servizi noti. Nessuna analisi, però, può garantire di trovare un attacco del tutto nuovo.",
    ],
    [
      "Rileva le app spia che una persona vicina potrebbe aver installato?",
      "Sì. Oltre allo spyware di alto livello, cerchiamo lo stalkerware: app commerciali che un partner, un familiare o un conoscente installa di nascosto per leggere i messaggi, vedere la posizione o ascoltare le chiamate. Le riconosciamo dal nome del pacchetto, dall’impronta del file di installazione e dai server a cui si collegano, grazie all’elenco pubblico di Echap. Su Android segnaliamo anche le app che si nascondono e riuniscono permessi di spionaggio, anche se non sono in nessun elenco. Le app di controllo parentale o di condivisione della posizione compaiono come punti da verificare, perché a volte vengono installate consapevolmente.",
    ],
    [
      "Quanto dura un’analisi completa?",
      "Dipende soprattutto da quanti dati contiene il telefono e dalla velocità del cavo. Un iPhone molto pieno può richiedere circa un’ora per la copia e un’altra per l’analisi; un telefono con pochi contenuti finisce molto prima. Per tutto il processo vedi l’avanzamento reale comunicato dal telefono e una stima del tempo rimanente. Puoi continuare a usare il computer e annullare in qualsiasi momento; cerca solo di non scollegare il telefono prima che la copia sia finita.",
    ],
    [
      "Perché l’iPhone chiede «Autorizza», il codice o una password del backup?",
      "Sono le protezioni dell’iPhone stesso, non di Enigm Scan. «Autorizza» e il codice permettono a questo computer di fare una copia del telefono; il codice lo digiti sullo schermo dell’iPhone e noi non lo vediamo mai. Se hai attivato i backup cifrati, l’iPhone li protegge con una password propria, diversa da quella dell’Apple ID, e te la chiederemo per poter leggere la copia. Quella password si usa solo durante l’analisi e non viene salvata da nessuna parte.",
    ],
    [
      "Che cos’è l’analisi approfondita dell’iPhone ed è obbligatoria?",
      "È un’opzione che puoi selezionare prima di iniziare. Subito dopo «Autorizza», ti chiediamo di premere insieme i tre tasti indicati e di rilasciarli alla vibrazione. L’iPhone crea allora un registro di diagnostica e la copia inizia appena lo conferma. Ne leggiamo solo i rapporti di arresto e il registro di spegnimento, dove spyware come Pegasus ha lasciato tracce, e il resto viene eliminato. Non tenere premuti i tasti, altrimenti chiameresti i soccorsi. Se non la selezioni, o scegli «Continua senza analisi approfondita», l’analisi prosegue normalmente.",
    ],
    [
      "Come attivo il debug USB sul mio telefono Android?",
      "Apri Impostazioni › Informazioni sul telefono e tocca sette volte di seguito «Numero build» finché compare il messaggio che ora sei sviluppatore; su alcuni telefoni si trova in «Informazioni software». Torna alle Impostazioni, apri «Opzioni sviluppatore» e attiva «Debug USB». Quando colleghi il cavo, il telefono ti chiederà se consentire il debug da questo computer: accetta. Finita l’analisi, puoi disattivare il debug USB e revocare le autorizzazioni dallo stesso menu.",
    ],
    [
      "Se il risultato è pulito, significa che nessuno mi spia?",
      "Significa che non abbiamo trovato tracce di spyware noti nei dati esaminati, ed è già un controllo serio. Ma nessuna analisi può garantire al 100% che un telefono sia pulito: un attacco nuovo, non ancora documentato, o uno che ha cancellato le proprie tracce, potrebbe passare inosservato. Se hai ancora motivi per sospettare, ripeti l’analisi più avanti, quando le liste di indicatori saranno aggiornate, oppure rivolgiti a uno specialista.",
    ],
    [
      "Che differenza c’è tra un indizio e un punto da verificare?",
      "Un indizio corrisponde a uno spyware noto, come un dominio, un’app o un file pubblicati dai ricercatori, oppure a un’app che unisce occultamento e funzioni di spionaggio. Un punto da verificare è un’impostazione o un’app insolita che non corrisponde a nulla di noto e compare anche su telefoni non infetti, come un’app installata fuori dallo store o un proxy di rete. Solo gli indizi cambiano il risultato dell’analisi. Per un punto da verificare, controlla se lo riconosci; altrimenti, rivolgiti a uno specialista.",
    ],
    [
      "Cosa devo fare se l’analisi trova segni di spyware?",
      "Prima di tutto, mantieni la calma: un segno va approfondito, non conferma un’infezione. Non cancellare nulla e non aggiornare né ripristinare il telefono, perché potresti distruggere le prove che servono a un esperto. Scarica il rapporto in PDF e conservalo in un posto sicuro. Poi contatta uno specialista di sicurezza digitale; se sei giornalista, attivista o lavori nella società civile, la linea di assistenza gratuita di Access Now può aiutarti.",
    ],
    [
      "Posso analizzare il telefono di un’altra persona?",
      "Solo se è tuo o se il proprietario ti ha dato un permesso esplicito. Ti chiediamo di confermarlo prima di iniziare, perché controllare il telefono di un’altra persona senza consenso può violarne la privacy e, in molti paesi, essere illegale. Se vuoi aiutare qualcuno a controllare il suo telefono, fallo insieme a lui e con il suo accordo.",
    ],
    [
      "Come posso proteggermi da questo tipo di attacchi?",
      "Parti dalle basi: tieni il telefono sempre aggiornato, riavvialo spesso e, se sei a rischio, attiva la modalità di isolamento dell’iPhone. Poi proteggi ciò che interessa di più a chi spia: le tue conversazioni. Con Enigm, messaggi e chiamate sono cifrati end-to-end, puoi creare l’account senza email né numero di telefono e l’app si protegge da manomissioni e dispositivi compromessi. Inoltre Active Defense analizza il telefono e il suo comportamento di rete alla ricerca di spyware, senza ispezionare le tue comunicazioni protette.",
      "Scopri Enigm su enigm.io",
    ],
    [
      "Cos’è Enigm e cosa offre oltre a Enigm Scan?",
      "Enigm è un’azienda svizzera della privacy che crea strumenti per comunicare e muoversi in sicurezza. La sua app principale offre messaggi e chiamate cifrati end-to-end, e con Enigm Server il tuo team può avere un proprio ambiente di messaggistica privato. Per ogni giorno ci sono anche Enigm eSIM, connettività mobile solo dati acquistabile senza verifica dell’identità, ed Enigm Gateway, un router pensato per proteggere la tua rete con VPN cifrata e protezione DNS. Tutto si gestisce da Enigm Command.",
      "Scopri Enigm su enigm.io",
    ],
    [
      "E se mi serve un telefono o un computer più sicuro?",
      "Enigm OS è una piattaforma per dispositivi sicura, disponibile sul Fairphone 6, che riduce la superficie di attacco, verifica i propri aggiornamenti e ti dà il controllo su rete, DNS e privacy del dispositivo. Per lavorare da qualsiasi computer c’è Enigm Link, una chiavetta USB sigillata con app per macOS, Windows e Linux che apre un ambiente protetto solo dopo aver convalidato il dispositivo e attivato la VPN. E per le emergenze, Enigm Key è un dispositivo fisico che invia un allarme SOS cifrato ai tuoi contatti con la pressione di un tasto, senza sbloccare il telefono.",
      "Scopri Enigm su enigm.io",
    ],
  ],
  pt: [
    [
      "O Enigm Scan é mesmo gratuito ou tem algum custo escondido?",
      "É mesmo gratuito. Não pedimos conta, e-mail nem cartão, e não há funções pagas escondidas nem limite de análises: pode verificar os seus telemóveis as vezes que quiser. O Enigm Scan é um projeto de código aberto da Enigm, a empresa suíça de privacidade que também desenvolve mensagens e chamadas privadas. Oferecemo-lo grátis porque saber se o espiam não deveria depender do que pode pagar.",
    ],
    [
      "De que preciso para analisar o meu telemóvel?",
      "De um computador: um Mac com macOS 13 ou posterior, ou um PC com Windows ou Linux. Também do seu telemóvel, iPhone ou Android, e de um cabo USB que transmita dados; alguns cabos baratos só carregam e o computador não vê o telemóvel com eles. Se analisar um iPhone no Windows, instale antes a app Apple Devices da Microsoft Store; no Linux precisa do usbmuxd, que a maioria das distribuições já inclui. Não precisa de instalar mais nada: o Enigm Scan abre diretamente a partir do ficheiro descarregado.",
    ],
    [
      "Os meus dados, ou os do telemóvel, saem alguma vez do meu computador?",
      "Não. Tudo acontece no seu computador: a cópia do telemóvel, a análise e o relatório. A cópia é temporária e é apagada quando fecha a app, e no iPhone nem sequer copiamos as suas fotos ou vídeos. A única coisa que a app descarrega da internet são as listas de indicadores de spyware, assinadas digitalmente para que ninguém as altere pelo caminho. Nunca enviamos à Enigm nem a ninguém nada sobre si, o seu telemóvel ou o resultado.",
    ],
    [
      "O que procura exatamente o Enigm Scan no meu telemóvel?",
      "Procura os vestígios deixados por famílias de spyware conhecidas, como Pegasus, Predator ou Candiru, e pelas apps de stalkerware usadas para espiar um parceiro ou familiar: domínios contactados, processos e ficheiros instalados, perfis e definições alterados. São mais de 11 000 indicadores documentados em investigações forenses públicas, comparados com as mensagens, o histórico de navegação, as apps, os processos e as definições do telemóvel. Usamos o MVT, o motor forense de código aberto utilizado por investigadores de segurança em todo o mundo. No Android também deteta apps que se comportam como spyware antes mesmo de estarem documentadas, e em todos os telemóveis procura ligações que imitam serviços conhecidos. Ainda assim, nenhuma análise pode garantir encontrar um ataque totalmente novo.",
    ],
    [
      "Deteta as apps espiãs que alguém próximo possa ter instalado?",
      "Sim. Além do spyware de alto nível, procuramos stalkerware: apps comerciais que um parceiro, um familiar ou um conhecido instala às escondidas para ler mensagens, ver a localização ou ouvir chamadas. Reconhecemo-las pelo nome do pacote, pela impressão do ficheiro de instalação e pelos servidores a que se ligam, com a lista pública da Echap. No Android também avisamos de apps que se escondem e reúnem permissões de espionagem, mesmo que não estejam em nenhuma lista. As apps de controlo parental ou de partilha de localização aparecem como pontos a rever, porque às vezes são instaladas de propósito.",
    ],
    [
      "Quanto tempo demora uma análise completa?",
      "Depende sobretudo da quantidade de dados do telemóvel e da velocidade do cabo. Um iPhone muito cheio pode demorar cerca de uma hora a copiar e outra a analisar; um telemóvel com pouco conteúdo termina bastante antes. Durante todo o processo vê o progresso real indicado pelo próprio telemóvel e uma estimativa do tempo restante. Pode continuar a usar o computador e cancelar a qualquer momento; tente apenas não desligar o telemóvel até a cópia terminar.",
    ],
    [
      "Porque é que o iPhone pede «Confiar», o código ou uma palavra-passe de cópia?",
      "São proteções do próprio iPhone, não do Enigm Scan. «Confiar» e o código autorizam este computador a fazer uma cópia do telemóvel; o código escreve-se no ecrã do iPhone e nós nunca o vemos. Se alguma vez ativou as cópias de segurança encriptadas, o iPhone protege-as com uma palavra-passe própria, diferente da do Apple ID, e vamos pedi-la para conseguir ler a cópia. Essa palavra-passe só é usada durante a análise e não fica guardada em lado nenhum.",
    ],
    [
      "O que é a análise profunda do iPhone e é obrigatória?",
      "É uma opção que pode marcar antes de começar. Logo depois de «Confiar», pedimos-lhe que prima ao mesmo tempo os três botões que assinalamos e os solte ao sentir a vibração. O iPhone cria então um registo de diagnóstico e a cópia começa assim que o confirma. Dele só lemos os relatórios de falhas e o registo de encerramento, onde spyware como o Pegasus deixou rasto, e o resto é apagado. Não mantenha os botões premidos, ou ligará para a emergência. Se não a marcar, ou escolher «Continuar sem análise profunda», a análise continua normalmente.",
    ],
    [
      "Como ativo a depuração USB no meu telemóvel Android?",
      "Abra Definições › Acerca do telefone e toque sete vezes seguidas em «Número de compilação» até aparecer a mensagem de que já é programador; em alguns telemóveis está em «Informações de software». Volte às Definições, abra «Opções de programador» e ative «Depuração USB». Ao ligar o cabo, o telemóvel pergunta se quer permitir a depuração a partir deste computador: aceite. No fim da análise, pode desativar a depuração USB e revogar as autorizações no mesmo menu.",
    ],
    [
      "Se o resultado sair limpo, quer dizer que ninguém me espia?",
      "Quer dizer que não encontrámos vestígios de nenhum spyware conhecido nos dados revistos, o que já é uma verificação séria. Mas nenhuma análise garante a 100 % que um telemóvel está limpo: um ataque novo, ainda não documentado, ou um que tenha apagado os seus rastos, pode passar despercebido. Se continuar a ter motivos para desconfiar, repita a análise mais tarde, quando as listas de indicadores tiverem sido atualizadas, ou fale com um especialista.",
    ],
    [
      "Qual é a diferença entre um indício e um ponto a rever?",
      "Um indício corresponde a spyware conhecido, como um domínio, uma app ou um ficheiro publicados por investigadores, ou a uma app que junta esconder-se a funções de espionagem. Um ponto a rever é uma definição ou app pouco habitual que não corresponde a nada conhecido e também aparece em telemóveis sem infeção, como uma app instalada fora de uma loja ou um proxy de rede. Só os indícios alteram o resultado da análise. Perante um ponto a rever, confirme se o reconhece; se não, consulte um especialista.",
    ],
    [
      "O que devo fazer se a análise encontrar sinais de spyware?",
      "Primeiro, mantenha a calma: um sinal merece ser analisado, não confirma uma infeção. Não apague nada nem atualize ou reponha o telemóvel, porque pode destruir as provas de que um especialista precisa. Descarregue o relatório em PDF e guarde-o num local seguro. Depois, contacte um especialista em segurança digital; se for jornalista, ativista ou trabalhar na sociedade civil, a linha de apoio gratuita da Access Now pode orientá-lo.",
    ],
    [
      "Posso analisar o telemóvel de outra pessoa?",
      "Só se for seu ou se o dono lhe tiver dado autorização explícita. Pedimos que o confirme antes de começar, porque analisar o telemóvel de outra pessoa sem consentimento pode violar a sua privacidade e, em muitos países, ser ilegal. Se quiser ajudar alguém a verificar o telemóvel, faça-o com essa pessoa presente e com o seu acordo.",
    ],
    [
      "Como me posso proteger deste tipo de ataques?",
      "Comece pelo básico: mantenha o telemóvel atualizado, reinicie-o com frequência e, se estiver em risco, ative o Modo de Bloqueio do iPhone. Depois, proteja o que mais interessa a quem espia: as suas conversas. Com a Enigm, as mensagens e chamadas são encriptadas de ponta a ponta, pode criar a conta sem e-mail nem número de telefone e a app protege-se contra manipulações e dispositivos comprometidos. O Active Defense analisa ainda o telemóvel e o seu comportamento de rede à procura de spyware, sem inspecionar as suas comunicações protegidas.",
      "Conheça a Enigm em enigm.io",
    ],
    [
      "O que é a Enigm e o que oferece além do Enigm Scan?",
      "A Enigm é uma empresa suíça de privacidade que cria ferramentas para comunicar e circular em segurança. A app principal oferece mensagens e chamadas encriptadas de ponta a ponta e, com o Enigm Server, a sua equipa pode ter o seu próprio ambiente de mensagens privado. Para o dia a dia há também o Enigm eSIM, conectividade móvel só de dados que pode comprar sem verificação de identidade, e o Enigm Gateway, um router concebido para proteger a sua rede com VPN encriptada e proteção DNS. Tudo é gerido a partir do Enigm Command.",
      "Conheça a Enigm em enigm.io",
    ],
    [
      "E se precisar de um telemóvel ou de um computador mais seguro?",
      "O Enigm OS é uma plataforma de dispositivo segura, disponível no Fairphone 6, que reduz a superfície de ataque, verifica as suas atualizações e dá-lhe controlo sobre a rede, o DNS e a privacidade do dispositivo. Para trabalhar a partir de qualquer computador existe o Enigm Link, uma pen USB selada com apps para macOS, Windows e Linux que só abre um ambiente protegido depois de validar o dispositivo e ativar a VPN. E para emergências, o Enigm Key é um dispositivo físico que envia um alerta SOS encriptado aos seus contactos com um simples botão, sem desbloquear o telemóvel.",
      "Conheça a Enigm em enigm.io",
    ],
  ],
};
