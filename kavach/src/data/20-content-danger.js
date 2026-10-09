/* ============================================================================
   data/20-content-danger — danger signs (pregnancy, labour, after delivery,
   newborn, young child). English follows the national MCP card (2018) and
   IMNCI; Odia follows the Odisha MCP card V-2023-24 wording where it exists.
   ============================================================================ */
K.content = K.content || {};
K.content.danger = {
  preg: {
    title: { en: 'Danger signs in pregnancy', or: 'ଗର୍ଭାବସ୍ଥାରେ ବିପଦ ଲକ୍ଷଣ' },
    lead: { en: 'If you or anyone in your family sees any of these signs, take the pregnant woman to the nearest appropriate hospital at once.', or: 'ଏଥିମଧ୍ୟରୁ କୌଣସି ଲକ୍ଷଣ ଦେଖାଦେଲେ ଗର୍ଭବତୀ ମହିଳାଙ୍କୁ ତୁରନ୍ତ ନିକଟସ୍ଥ ଉପଯୁକ୍ତ ଡାକ୍ତରଖାନାକୁ ନିଅନ୍ତୁ।' },
    items: [
      { k: 'bleed', icon: 'drop', en: 'Bleeding from the vagina', or: 'ରକ୍ତସ୍ରାବ ହେବା' },
      { k: 'anaemia', icon: 'pulse', en: 'Severe anaemia: very pale, weak, breathless', or: 'ରକ୍ତହୀନତା: ଅତ୍ୟଧିକ ଦୁର୍ବଳ, ଧଇଁସଇଁ ହେବା' },
      { k: 'fever', icon: 'temp', en: 'High fever', or: 'ଜ୍ୱର ହେବା' },
      { k: 'fits', icon: 'alert', en: 'Fits (convulsions)', or: 'ବାତ ମାରିବା' },
      { k: 'head', icon: 'eye', en: 'Severe headache, blurred vision or dizziness', or: 'ପ୍ରବଳ ମୁଣ୍ଡବିନ୍ଧା, ଆଖି ଝାପ୍‌ସା ଦେଖାଯିବା ବା ମୁଣ୍ଡ ବୁଲାଇବା' },
      { k: 'swell', icon: 'hand', en: 'Swelling of the face, hands or whole body', or: 'ପାଦ, ହାତ ବା ମୁହଁ ଫୁଲିବା' },
      { k: 'vomit', icon: 'water', en: 'Vomiting again and again', or: 'ଅତିରିକ୍ତ ବାନ୍ତି ହେବା' },
      { k: 'jaund', icon: 'sun', en: 'Yellow eyes or skin (jaundice)', or: 'ହଳଦିଆ ପଡ଼ିବା (କାମଳ ରୋଗ)' },
      { k: 'fm', icon: 'baby', en: 'Baby moves less, or stops moving', or: 'ପେଟରେ ପିଲା କମ୍ ଚଳିବା ବା ନ ଚଳିବା' },
      { k: 'leak', icon: 'drop', en: 'Water breaks or leaks before labour pains', or: 'ପ୍ରସବ ଯନ୍ତ୍ରଣା ପୂର୍ବରୁ ପାଣି ଥଳି ଫାଟିଯିବା ବା ପାଣି ଯିବା' },
      { k: 'preterm', icon: 'clock', en: 'Labour pains before 37 weeks', or: '୩୭ ସପ୍ତାହ ପୂର୍ବରୁ ପ୍ରସବ ଯନ୍ତ୍ରଣା' },
      { k: 'pain', icon: 'alert', en: 'Severe pain in the belly', or: 'ପେଟରେ ପ୍ରବଳ ଯନ୍ତ୍ରଣା' },
    ],
  },
  labour: {
    title: { en: 'Danger signs during labour', or: 'ପ୍ରସବ ସମୟରେ ବିପଦ ଲକ୍ଷଣ' },
    lead: { en: 'Go to the hospital immediately. Call 108 or 102 for free transport.', or: 'ତୁରନ୍ତ ଡାକ୍ତରଖାନା ଯାଆନ୍ତୁ। ମାଗଣା ଯାତାୟାତ ପାଇଁ ୧୦୮ ବା ୧୦୨ କୁ ଫୋନ୍ କରନ୍ତୁ।' },
    items: [
      { k: 'long', icon: 'clock', en: 'Labour pains for more than 12 hours', or: 'ପ୍ରସବ ଯନ୍ତ୍ରଣା ୧୨ ଘଣ୍ଟାରୁ ଅଧିକ ହେବା' },
      { k: 'water', icon: 'drop', en: 'Water bag bursts without labour pains', or: 'ପ୍ରସବ ଯନ୍ତ୍ରଣା ପୂର୍ବରୁ ଗର୍ଭାଶୟର ପାଣି ଥଳି ଫାଟିଯିବା ବା ଦେହରୁ ପାଣି ଯିବା' },
      { k: 'early', icon: 'clock', en: 'Water bag bursts too early (before 37 weeks)', or: 'ଅସମୟରେ ପାଣିଥଳି ଫାଟିଯିବା' },
      { k: 'bleed', icon: 'drop', en: 'Heavy bleeding', or: 'ଅତିରିକ୍ତ ରକ୍ତସ୍ରାବ ହେବା' },
      { k: 'fits', icon: 'alert', en: 'Fits (convulsions)', or: 'ବାତ ମାରିବା' },
      { k: 'fever', icon: 'temp', en: 'Fever', or: 'ଜ୍ୱର ହେବା' },
      { k: 'anaemia', icon: 'pulse', en: 'Severe anaemia', or: 'ରକ୍ତହୀନତା ହେବା' },
    ],
  },
  post: {
    title: { en: 'Danger signs after delivery (mother)', or: 'ପ୍ରସବ ପରେ ମା\'ଙ୍କ ବିପଦ ଲକ୍ଷଣ' },
    lead: { en: 'These can happen up to 6 weeks (42 days) after delivery. Go to the hospital at once.', or: 'ପ୍ରସବ ପରେ ୬ ସପ୍ତାହ (୪୨ ଦିନ) ପର୍ଯ୍ୟନ୍ତ ଏହା ହୋଇପାରେ। ତୁରନ୍ତ ଡାକ୍ତରଖାନା ଯାଆନ୍ତୁ।' },
    items: [
      { k: 'bleed', icon: 'drop', en: 'Heavy bleeding (soaking more than one pad an hour)', or: 'ଅତିରିକ୍ତ ରକ୍ତସ୍ରାବ ହେବା' },
      { k: 'fever', icon: 'temp', en: 'Fever within 42 days of delivery', or: '୪୨ ଦିନ ଭିତରେ ଜ୍ୱର ହେବା' },
      { k: 'fits', icon: 'alert', en: 'Fits (convulsions)', or: 'ବାତ ମାରିବା' },
      { k: 'faint', icon: 'alert', en: 'Fainting or unconsciousness', or: 'ଅଚେତ ହୋଇ ପଡ଼ିବା' },
      { k: 'smell', icon: 'drop', en: 'Foul-smelling discharge from the vagina', or: 'ଦୁର୍ଗନ୍ଧଯୁକ୍ତ ସ୍ରାବ ହେବା' },
      { k: 'head', icon: 'eye', en: 'Severe headache or blurred vision', or: 'ପ୍ରବଳ ମୁଣ୍ଡବିନ୍ଧା ବା ଆଖି ଝାପ୍‌ସା ଦେଖାଯିବା' },
      { k: 'breath', icon: 'lungs', en: 'Difficulty breathing or chest pain', or: 'ନିଃଶ୍ୱାସ ନେବାରେ କଷ୍ଟ ବା ଛାତିରେ ଯନ୍ତ୍ରଣା' },
      { k: 'breast', icon: 'heart', en: 'Breast red, hot, swollen and painful', or: 'ସ୍ତନ ଲାଲ, ଗରମ, ଫୁଲା ଓ ଯନ୍ତ୍ରଣାଦାୟକ ହେବା' },
      { k: 'leg', icon: 'hand', en: 'Painful swelling of one leg', or: 'ଗୋଟିଏ ଗୋଡ଼ ଫୁଲି ଯନ୍ତ୍ରଣା ହେବା' },
      { k: 'mood', icon: 'heart', en: 'Very sad or anxious most days, cannot sleep, or thoughts of harming herself or the baby', or: 'ଅଧିକାଂଶ ଦିନ ଅତ୍ୟଧିକ ଦୁଃଖ ବା ଚିନ୍ତା, ନିଦ ନ ହେବା, କିମ୍ବା ନିଜକୁ ବା ଶିଶୁକୁ କ୍ଷତି କରିବା ଚିନ୍ତା' },
    ],
    note: { en: 'For low mood or worry after delivery, also call Tele-MANAS 14416 (free, 24×7).', or: 'ପ୍ରସବ ପରେ ମନ ଦୁଃଖ ବା ଚିନ୍ତା ପାଇଁ ଟେଲି-ମାନସ୍ ୧୪୪୧୬ କୁ ମଧ୍ୟ ଫୋନ୍ କରନ୍ତୁ (ମାଗଣା, ୨୪ ଘଣ୍ଟା)।' },
  },
  newborn: {
    title: { en: 'Danger signs in a newborn (first 2 months)', or: 'ନବଜାତ ଶିଶୁର ବିପଦ ଲକ୍ଷଣ (ପ୍ରଥମ ୨ ମାସ)' },
    lead: { en: 'Contact your health worker immediately, or take the baby to hospital, if the baby:', or: 'ନିମ୍ନ ଲିଖିତ ବିପଦଲକ୍ଷଣ ଦେଖାଦେଲେ ତୁରନ୍ତ ସ୍ୱାସ୍ଥ୍ୟ କର୍ମୀଙ୍କ ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ ବା ଶିଶୁକୁ ଡାକ୍ତରଖାନା ନିଅନ୍ତୁ:' },
    items: [
      { k: 'feed', icon: 'bottle', en: 'Is not able to suck or feed', or: 'ଶିଶୁ ମା\'କ୍ଷୀର ଟାଣିପାରୁ ନଥିବ କିମ୍ବା ଖାଇ ନ ପାରୁଥିବ' },
      { k: 'fits', icon: 'alert', en: 'Has fits (convulsions)', or: 'ବାତ ମାରୁଥାଏ' },
      { k: 'breath', icon: 'lungs', en: 'Breathes fast (60 or more breaths a minute) or with difficulty', or: 'ମିନିଟ୍‌କୁ ୬୦ ବା ଅଧିକ ଥର ଶ୍ୱାସ ନେଉଥିବ, ବା ନିଃଶ୍ୱାସ ପ୍ରଶ୍ୱାସ ନେବାରେ କଷ୍ଟ ଅନୁଭବ କରେ' },
      { k: 'chest', icon: 'lungs', en: 'Lower chest pulls in deeply when breathing', or: 'ନିଃଶ୍ୱାସ ନେଲାବେଳେ ଛାତି ଭିତରକୁ ଅତ୍ୟଧିକ ପଶିଯାଉଥିବ' },
      { k: 'hot', icon: 'temp', en: 'Feels hot (armpit temperature 37.5 °C or more)', or: 'ଶରୀର ଗରମ (କାଖ ତାପମାତ୍ରା ୩୭.୫ °C ବା ଅଧିକ)' },
      { k: 'cold', icon: 'temp', en: 'Feels cold (armpit temperature below 35.5 °C)', or: 'ଶରୀର ଥଣ୍ଡା (କାଖ ତାପମାତ୍ରା ୩୫.୫ °C ରୁ କମ୍)' },
      { k: 'limp', icon: 'baby', en: 'Moves only when touched, or not at all; looks very sleepy or unconscious', or: 'ଛୁଇଁଲେ ହିଁ ହଲେ ବା ଆଦୌ ହଲେ ନାହିଁ; ନିସ୍ତେଜ ବା ଅଚେତ ହେଲା ପରି ଲାଗେ' },
      { k: 'yellow', icon: 'sun', en: 'Palms and soles look yellow', or: 'ପାଦ ଓ ହାତ ପାପୁଲି ହଳଦିଆ ହୋଇଯାଏ' },
      { k: 'blood', icon: 'drop', en: 'Blood in the stool', or: 'ଝାଡ଼ାରେ ରକ୍ତ ପଡ଼ୁଥାଏ' },
      { k: 'vomit', icon: 'water', en: 'Vomits again and again', or: 'ଶିଶୁ ବାରମ୍ବାର ବାନ୍ତି କରୁଥିଲେ' },
      { k: 'pus', icon: 'alert', en: 'Has pus-filled boils on the skin, or a red, smelly cord', or: 'ଶରୀରରେ ପୂଜଥିବା ଫୋଟକା ଥିଲେ, ବା ନାଭି ଲାଲ ଓ ଦୁର୍ଗନ୍ଧଯୁକ୍ତ ହେଲେ' },
      { k: 'urine', icon: 'clock', en: 'Has not passed urine within 48 hours, or stool within 24 hours, of birth', or: 'ଜନ୍ମର ୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ପରିସ୍ରା ନହେଲେ ବା ୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ ଝାଡ଼ା ନହେଲେ' },
    ],
  },
  child: {
    title: { en: 'Danger signs in a young child (2 months – 5 years)', or: 'ଛୋଟ ପିଲାଙ୍କ ବିପଦ ଲକ୍ଷଣ (୨ ମାସ – ୫ ବର୍ଷ)' },
    lead: { en: 'Take the child to a health facility the same day if the child:', or: 'ପିଲାଙ୍କଠାରେ ଏହି ଲକ୍ଷଣ ଦେଖାଦେଲେ ସେହି ଦିନ ହିଁ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ନିଅନ୍ତୁ:' },
    items: [
      { k: 'drink', icon: 'bottle', en: 'Cannot drink or breastfeed', or: 'ପିଇ ପାରୁନାହିଁ ବା ମା\'କ୍ଷୀର ଖାଇ ପାରୁନାହିଁ' },
      { k: 'vomit', icon: 'water', en: 'Vomits everything', or: 'ଯାହା ଖାଏ ସବୁ ବାନ୍ତି କରିଦିଏ' },
      { k: 'fits', icon: 'alert', en: 'Has had fits (convulsions)', or: 'ବାତ ମାରିଛି' },
      { k: 'limp', icon: 'baby', en: 'Is very sleepy, hard to wake, or unconscious', or: 'ଅତ୍ୟଧିକ ନିଦୁଆ, ଉଠାଇବା କଷ୍ଟ ବା ଅଚେତ' },
      { k: 'breath', icon: 'lungs', en: 'Breathes fast or the chest pulls in', or: 'ଶ୍ୱାସ ପ୍ରଶ୍ୱାସ ଦ୍ରୁତ ବା ଛାତି ଭିତରକୁ ପଶୁଛି' },
      { k: 'dehyd', icon: 'water', en: 'Diarrhoea with sunken eyes, very thirsty or very weak', or: 'ତରଳ ଝାଡ଼ା ସହିତ ଆଖି ଗାତକୁ ପଶିବା, ଅତ୍ୟଧିକ ଶୋଷ ବା ଦୁର୍ବଳତା' },
      { k: 'blood', icon: 'drop', en: 'Blood in the stool', or: 'ଝାଡ଼ାରେ ରକ୍ତ' },
      { k: 'fever', icon: 'temp', en: 'High fever, or fever for more than 7 days', or: 'ପ୍ରବଳ ଜ୍ୱର, ବା ୭ ଦିନରୁ ଅଧିକ ଜ୍ୱର' },
      { k: 'oedema', icon: 'hand', en: 'Swelling of both feet, or looks very thin', or: 'ଦୁଇ ପାଦ ଫୁଲିବା, ବା ଅତ୍ୟଧିକ ଶୁଖିଲା ଦେଖାଯିବା' },
    ],
  },
  go: {
    title: { en: 'On the way to hospital', or: 'ଡାକ୍ତରଖାନା ଯିବା ବାଟରେ' },
    items: [
      { en: 'Call 108 (ambulance) or 102 (Janani Express). Both are free.', or: '୧୦୮ (ଆମ୍ବୁଲାନ୍ସ) ବା ୧୦୨ (ଜନନୀ ଏକ୍ସପ୍ରେସ୍) କୁ ଫୋନ୍ କରନ୍ତୁ। ଦୁହେଁ ମାଗଣା।' },
      { en: 'Carry this MCP card and any reports.', or: 'MCP କାର୍ଡ ଓ ସମସ୍ତ ରିପୋର୍ଟ ସାଙ୍ଗରେ ନିଅନ୍ତୁ।' },
      { en: 'Keep the baby warm, skin-to-skin with the mother, and keep breastfeeding if the baby can feed.', or: 'ଶିଶୁକୁ ଉଷୁମ ରଖନ୍ତୁ, ମା\'ଙ୍କ ଛାତିରେ ଲଗାଇ ରଖନ୍ତୁ, ଖାଇପାରିଲେ ସ୍ତନ୍ୟପାନ ଜାରି ରଖନ୍ତୁ।' },
      { en: 'If the child has fits, lay the child on the side with the head a little lower; do not put anything in the mouth.', or: 'ପିଲାକୁ ବାତ ମାରିଲେ, କଡ଼ ଲେଉଟାଇ ଶୁଆଇ ମୁଣ୍ଡ ଟିକେ ତଳକୁ ରଖନ୍ତୁ; ପାଟିରେ କିଛି ଦିଅନ୍ତୁ ନାହିଁ।' },
      { en: 'Inform your ASHA or ANM.', or: 'ଆପଣଙ୍କ ଆଶା ବା ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ଜଣାନ୍ତୁ।' },
    ],
  },
};
