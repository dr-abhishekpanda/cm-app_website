/* ============================================================================
   data/50-dev — developmental milestones, parenting tips and warning signs.
   English: national MCP card 2018 pp.12–25. Odia: Odisha MCP card V-2023-24
   pp.11–24 (obvious print slips corrected: ପତ୍ୟେକ→ପ୍ରତ୍ୟେକ, ବୁଲଉ→ବୁଲାଉ,
   ଧିର→ଧୀର, ସିଡ଼ି→ସିଢ଼ି, ଉଚାରଣ→ଉଚ୍ଚାରଣ). One meaning fix for review: 24-month
   warning 1 follows the national card ("does not walk steadily while pulling
   a toy"); the Odisha print says "cannot stand steady".
   The mother ticks what the child can do; the ASHA/AWW checks the warning
   signs at the "at N months" age. Any warning sign → health worker / DEIC.
   Bands: `from` = month (corrected age under 2 y) when the band becomes
   current; `at` = month the warning signs apply.
   ============================================================================ */
K.dev = K.dev || {};
K.dev.BANDS = [
  {
    k: 'm3', from: 1.5, at: 3,
    name: { en: 'By 2–3 months', or: '୨-୩ ମାସ ଭିତରେ' }, atName: { en: 'At 3 months', or: '୩ ମାସ ବୟସରେ' },
    can: [
      { en: "Begins to recognise the mother's face", or: 'ମା’ର ମୁହଁକୁ ଦେଖି ଚିହ୍ନି ପାରୁଛି' },
      { en: 'Smiles at people (social smile)', or: 'ଲୋକମାନଙ୍କୁ ଦେଖି ହସି ପାରୁଛି' },
      { en: 'Makes eye contact', or: 'ଆଖିକୁ ଆଖି ମିଳେଇ ପାରୁଛି' },
      { en: 'Moves both arms and both legs when excited', or: 'ଖୁସି ହୋଇ ଦି ହାତ ଓ ଦି ଗୋଡ଼ ହଲେଇ ପାରୁଛି' },
      { en: 'Keeps hands open and relaxed', or: 'ହାତକୁ ଆରାମ୍‌ରେ ଓ ଖୋଲା କରି ରଖି ପାରୁଛି' },
      { en: 'Raises head at times when lying on the tummy', or: 'ପେଟେଇକି ଶୋଇଲେ ବେଳେ ବେଳେ ମୁଣ୍ଡ ଟେକି ପାରୁଛି' },
    ],
    tips: [
      { en: "Massage gently, and stretch and exercise the baby's arms and legs.", or: 'ଶିଶୁକୁ ହାଲ୍‌କାରେ ମାଲିଶ କରନ୍ତୁ ଏବଂ ଶିଶୁର ହାତ ଓ ଗୋଡ଼କୁ ହାଲ୍‌କାରେ ଟାଣି ବ୍ୟାୟାମ କରାନ୍ତୁ।' },
      { en: 'Let the baby lie on the tummy for some time every day.', or: 'ପ୍ରତ୍ୟେକ ଦିନ କିଛି ସମୟ ପାଇଁ ଶିଶୁକୁ ପେଟେଇକି ଶୋଇବା ପାଇଁ ଉତ୍ସାହିତ କରାନ୍ତୁ।' },
      { en: 'Cuddle and play with the baby every day. Cuddling or quickly responding to every cry does not spoil a baby.', or: 'ସବୁଦିନ ଶିଶୁଙ୍କୁ କୁଣ୍ଢେଇ ଗେହ୍ଲା କରନ୍ତୁ ଓ ତା’ଙ୍କ ସହ ଖେଳନ୍ତୁ।' },
      { en: 'Talk to the baby in your mother tongue every day.', or: 'ପ୍ରତ୍ୟେକ ଦିନ ଶିଶୁଟି ସାଙ୍ଗରେ ନିଜ ମାତୃଭାଷାରେ କଥା ହୁଅନ୍ତୁ।' },
      { en: 'Hang colourful moving objects about 1 foot (30 cm) away for the baby to look at and follow.', or: 'ଶିଶୁ ଠାରୁ ଫୁଟେ ଦୂରରେ କିଛି ରଙ୍ଗିନ ହଲୁଥିବା ବସ୍ତୁ ଟଙ୍ଗାନ୍ତୁ ଯେପରି କି ଶିଶୁ ସେହି ବସ୍ତୁ ଉପରେ ନଜରକୁ କେନ୍ଦ୍ରିତ କରି ତା’କୁ ଅନୁସରଣ କରିପାରିବ।' },
      { en: 'Keep mobile phones, TV and other screens away from children under 2 years.', or: '୨୪ ମାସରୁ କମ୍ ବୟସର ଶିଶୁମାନଙ୍କୁ ମୋବାଇଲ୍ ଫୋନ୍, ଟି.ଭି. ବା କୌଣସି ଇଲେକ୍‌ଟ୍ରୋନିକ୍ ଉପକରଣର ସଂସ୍ପର୍ଶରେ ଆଣନ୍ତୁ ନାହିଁ।' },
    ],
    warn: [
      { en: 'Does not make eye contact when being fed, cuddled or spoken to', or: 'ଶିଶୁକୁ ଖୁଆଇବା ସମୟରେ, ଗେହ୍ଲା କରିବା ସମୟରେ ବା ତା’ ସହିତ କଥା ହେବା ସମୟରେ ସେ ଆଖିକୁ ଆଖି ମିଳାଉନାହିଁ' },
      { en: 'Eyes squint all the time after 2 months', or: '୨ ମାସ ପରେ ଆଖି ଡୋଳା ସବୁବେଳେ ଟେରା କରି ରଖୁଛି' },
      { en: 'Does not smile at anyone', or: 'କାହାକୁ ଦେଖି ହସୁ ନାହିଁ' },
      { en: 'Does not startle, wake up or cry at a sudden loud sound', or: 'ହଠାତ୍ କିଛି ବଡ଼ ଆୱାଜ୍ ହେଲେ, ଶିଶୁ ଚମକୁ ନାହିଁ ବା ଉଠୁ ନାହିଁ ବା କାନ୍ଦୁ ନାହିଁ' },
      { en: 'Head pushed back, with stiff arms and legs', or: 'ମୁଣ୍ଡକୁ ପଛକୁ ରଖି, ହାତ ଓ ଗୋଡ଼ ଟାଣ କରି ରଖୁଛି' },
      { en: 'Always keeps the thumb inside the palm, hands open or fisted', or: 'ସବୁବେଳେ ହାତ ଖୋଲା କରି ବା ମୁଠା କରି ବୁଢ଼ା ଆଙ୍ଗୁଠିକୁ ପାପୁଲି ଭିତରେ ପସେଇ ରଖୁଛି' },
    ],
  },
  {
    k: 'm6', from: 4, at: 6,
    name: { en: 'By 4–6 months', or: '୪-୬ ମାସ ଭିତରେ' }, atName: { en: 'At 6 months', or: '୬ ମାସ ବୟସରେ' },
    can: [
      { en: 'Holds the head steady when held upright, and sits with support', or: 'ଶିଶୁକୁ ସିଧା ଧରିଲେ ସିଏ ମୁଣ୍ଡକୁ ସ୍ଥିର କରି ରଖିପାରୁଛି ଏବଂ ସାହାରା ନେଇ ବସିପାରୁଛି' },
      { en: 'Turns the head towards a sound', or: 'ଶବ୍ଦ ଆସୁଥିବା ଦିଗକୁ ମୁଣ୍ଡ ବୁଲାଇ ଚାହିଁପାରୁଛି' },
      { en: 'Tries to reach for and grasp an object', or: 'କୌଣସି ବସ୍ତୁକୁ ଦେଖି ତା ଆଡ଼କୁ ପହଞ୍ଚିବାକୁ ଓ ତା’କୁ ଧରିବାକୁ ଚେଷ୍ଟା କରିପାରୁଛି' },
      { en: 'Laughs aloud or squeals', or: 'ଜୋର୍‌ରେ ହସିପାରୁଛି ବା କୁହାଟ ମାରିପାରୁଛି' },
      { en: 'Babbles "ah, ee, oo" other than crying', or: 'କାନ୍ଦିବା ଛଡ଼ା ‘ଆ’, ‘ଇ’, ‘ଉ’ ପରି କିଛି ଶବ୍ଦ କହିପାରୁଛି' },
      { en: 'Likes to look at self in a mirror', or: 'ନିଜର ଛବି ଦର୍ପଣରେ ଦେଖିବାକୁ ଭଲ ପାଉଛି' },
    ],
    tips: [
      { en: 'Talk with the baby; copy the baby’s sounds and praise the baby for copying yours.', or: 'ନିଜ ଶିଶୁ ସାଙ୍ଗେ କଥାବାର୍ତ୍ତା ହୁଅନ୍ତୁ; ତା’ଙ୍କ ପରି ଶବ୍ଦ କରନ୍ତୁ ଓ ସିଏ ଆପଣଙ୍କ ପରି ଶବ୍ଦ ବାହାର କରିଲେ ତାକୁ ଉତ୍ସାହିତ କରନ୍ତୁ।' },
      { en: 'Put interesting things on the floor for the baby to reach out and explore.', or: 'ଭୁଇଁରେ ବିଭିନ୍ନ ରୋଚକ ଆକର୍ଷକ ବସ୍ତୁ ସଜାଇ ରଖନ୍ତୁ ଯାହା ଦେଖି ଶିଶୁ ସେଗୁଡ଼ିକ ଧରିବାକୁ ଚାହିଁବ ବା ସେସବୁ ଜିନିଷଗୁଡ଼ିକ କ’ଣ ତାହା ନିଜେ ବୁଝିବାକୁ ଚାହିଁବ।' },
      { en: 'Take the baby outdoors and show the world outside.', or: 'ଶିଶୁକୁ ଘର ବାହାରକୁ ନେଇ ବାହାର ଦୁନିଆର ବସ୍ତୁଗୁଡ଼ିକ ସହିତ ପରିଚିତ କରାନ୍ତୁ।' },
      { en: 'Babies suck their fingers and thumb for comfort. This is not a worry; do not stop it early.', or: 'ଶିଶୁମାନେ ନିଜ ମନ ବୁଝାଇବା ପାଇଁ ନିଜ ଆଙ୍ଗୁଠି ବା ବୁଢ଼ା ଆଙ୍ଗୁଠିକୁ ଚୁଚୁମି ଥା’ନ୍ତି। ଏହା କୌଣସି ଚିନ୍ତାର ବିଷୟ ନୁହେଁ। ଏହା ନିର୍ଦ୍ଦିଷ୍ଟ ସମୟ ଆଗରୁ ବନ୍ଦ କରନ୍ତୁ ନାହିଁ।' },
    ],
    warn: [
      { en: 'No head control', or: 'ମୁଣ୍ଡ ସିଧା ରଖି ପାରୁନାହିଁ' },
      { en: 'Does not make sounds like "ah", "ee", "oo"', or: '‘ଆ’ ‘ଇ’ ‘ଉ’ ପରି କିଛି ଶବ୍ଦ କରୁନାହିଁ' },
      { en: 'Cannot sit even with help', or: 'ସହାୟତା ସହିତ ମଧ୍ୟ ବସି ପାରୁନାହିଁ' },
      { en: 'Head and eyes do not follow a moving object', or: 'ସାମ୍ନାରେ ହଲୁଥିବା ବସ୍ତୁକୁ ଦେଖିବା ପାଇଁ ମୁଣ୍ଡକୁ ବା ଆଖିକୁ ବୁଲାଉ ନାହିଁ' },
      { en: 'Does not grasp things within reach', or: 'ନିଜ ପହଞ୍ଚରେ ଥିବା ବସ୍ତୁକୁ ଧରୁନାହିଁ' },
      { en: 'Cannot raise the head when lying on the tummy', or: 'ପେଟେଇକି ଶୋଇଲେ ମୁଣ୍ଡ ଟେକି ପାରୁନାହିଁ' },
    ],
  },
  {
    k: 'm9', from: 7, at: 9,
    name: { en: 'By 7–9 months', or: '୭-୯ ମାସ ଭିତରେ' }, atName: { en: 'At 9 months', or: '୯ ମାସ ବୟସରେ' },
    can: [
      { en: 'Rolls over in both directions', or: 'ଦୁଇ ପଟକୁ କଡ଼ ଲେଉଟାଇ ପାରୁଛି' },
      { en: 'Grasps a toy using all the fingers', or: 'ସବୁ ଆଙ୍ଗୁଠିର ପ୍ରୟୋଗ କରି କୌଣସି ଖେଳଣାକୁ ଧରିପାରୁଛି' },
      { en: 'Turns the head to follow familiar faces or toys', or: 'ଚିହ୍ନିଥିବା ଚେହେରା ବା ଖେଳଣାଗୁଡ଼ିକୁ ଅନୁସରଣ କରିବା ପାଇଁ ନିଜ ମୁଣ୍ଡକୁ ବୁଲାଇ ପାରୁଛି' },
      { en: 'Looks for toys hidden in front of the baby', or: 'ସାମନାରେ ଲୁଚାଇଥିବା ଖେଳଣାଗୁଡ଼ିକୁ ଖୋଜିବା ପାଇଁ ଚେଷ୍ଟା କରିପାରୁଛି' },
      { en: 'Responds when the name is called', or: 'ଶିଶୁଟିର ନା’ ଡାକିଲେ ଶୁଣୁଛି' },
    ],
    tips: [
      { en: 'Let the baby drop, bang and throw things again and again. Respond to the baby’s noises gently and patiently.', or: 'ଶିଶୁଟିକୁ ତା’ ଖେଳନା ବା ଜିନିଷଗୁଡ଼ିକୁ ବାରମ୍ବାର ପକେଇବାକୁ, ବାଡ଼େଇବାକୁ ବା ଫିଙ୍ଗିବାକୁ ଦିଅନ୍ତୁ। ଶିଶୁଟି କରୁଥିବା ଶବ୍ଦଗୁଡ଼ିକୁ ଧୀରସ୍ଥିର ଭାବେ ଏବଂ କୋମଳ ଭାବେ ଉତ୍ତର ଦିଅନ୍ତୁ।' },
      { en: 'Give clean, safe household utensils to play with and explore.', or: 'ଶିଶୁକୁ ଘରେ ବ୍ୟବହାର କରୁଥିବା ସଫା ଏବଂ ସୁରକ୍ଷିତ ବାସନକୁସନ ଖେଳିବା ପାଇଁ ଏବଂ ଅନୁସନ୍ଧାନ କରିବା ପାଇଁ ଦିଅନ୍ତୁ।' },
      { en: 'Play peek-a-boo. Hide the baby’s favourite toy under a cloth or box and see if the baby finds it.', or: 'ଶିଶୁ ସହିତ ଲୁଚକାଳି ଖେଳନ୍ତୁ। ଶିଶୁର ପ୍ରିୟ ଖେଳଣାଟିକୁ ଗୋଟିଏ କପଡ଼ା ବା ବାକ୍ସ ତଳେ ଲୁଚାଇ ଦେଖନ୍ତୁ। ଶିଶୁଟି ଖୋଜି ପାରୁଛି କି ନାହିଁ।' },
    ],
    warn: [
      { en: 'Cannot roll over', or: 'କଡ଼ ଲେଉଟାଇ ପାରୁନାହିଁ' },
      { en: 'Needs support to sit', or: 'ବସିବା ପାଇଁ ସହାୟତା ଲୋଡ଼ା କରୁଛି' },
      { en: 'Does not turn towards a sound coming from out of sight', or: 'ନିଜ ଦୃଷ୍ଟିରୁ ଦୂରରେ ପ୍ରକଟ ହେଉଥିବା ଶବ୍ଦ ଆଡ଼କୁ ବୁଲୁ ନାହିଁ ବା ଚାହୁଁ ନାହିଁ' },
      { en: 'Does not say "pa-pa-pa", "ma-ma", "ba-ba-ba" and similar sounds', or: 'ପା...ପା...ପା...ମା...ମା, ବା...ବା...ବା, ଇତ୍ୟାଦି ପରି କିଛି ଶବ୍ଦ କହୁ ନାହିଁ' },
      { en: 'Always tilts the head to one side when looking at things', or: 'କୌଣସି ବସ୍ତୁ ଆଡ଼େ ଚାହିଁବା ସମୟରେ ସବୁବେଳେ ଗୋଟିଏ ଆଡ଼କୁ ମୁଣ୍ଡ ଝୁଲାଇ ରଖୁଛି' },
    ],
  },
  {
    k: 'm12', from: 10, at: 12,
    name: { en: 'By 10–12 months', or: '୧୦-୧୨ ମାସ ବୟସ ଭିତରେ' }, atName: { en: 'At 12 months', or: '୧୨ ମାସ ବୟସରେ' },
    can: [
      { en: 'Sits without support and reaches for toys without falling', or: 'କୌଣସି ସହାୟତା ବିନା ବସିପାରୁଛି ଓ ବିନା ପଡ଼ି ଖେଳଣାଗୁଡ଼ିକୁ ଧରିପାରୁଛି' },
      { en: 'Raises arms to be picked up', or: 'କୋଳେଇ ନେବା ପାଇଁ ଦୁଇ ହାତ ଉଠେଇ ଇସାରା କରିପାରୁଛି' },
      { en: 'Crawls to a wanted toy without bumping into things', or: 'ନିଜେ ଚାହୁଁଥିବା ଖେଳଣାଗୁଡ଼ିକୁ ଧରିବା ପାଇଁ, ଅନ୍ୟ କୌଣସି ବସ୍ତୁ ସହିତ ନ ଧକ୍କା ହୋଇ ଆରାମ୍‌ରେ ଗୁରୁଣ୍ଡି ପାରୁଛି' },
      { en: 'Says one or two common words in the mother tongue', or: 'ନିଜ ମାତୃଭାଷାରେ ଗୋଟିଏ କି ଦୁଇଟି ଶବ୍ଦ କହିପାରୁଛି' },
      { en: 'Understands simple requests like "no" or "come here"', or: 'କିଛିଟି ସାଧାରଣ କଥା ଯେପରି କି ‘ନା’ / ‘ଏଠିକୁ ଆସ’ ପରି ଅନୁରୋଧକୁ ବୁଝିପାରୁଛି' },
    ],
    tips: [
      { en: 'Keep a toy slightly out of reach to encourage the baby to stand and walk holding on to something.', or: 'କିଛି ଖେଳଣାକୁ ଶିଶୁର ପହଞ୍ଚରୁ ଟିକେ ଦୂରରେ ରଖି ଶିଶୁଟିକୁ କୌଣସି ବସ୍ତୁର ସହାୟତା ନେଇ ଠିଆ ହେବା ପାଇଁ ଓ ଚାଲିବା ପାଇଁ ଉତ୍ସାହିତ କରନ୍ତୁ।' },
      { en: 'While exploring, babies may hurt others by accident. Show them how to touch gently; do not shout at them.', or: 'ନୂତନ ବସ୍ତୁ ଗୁଡ଼ିକୁ ଅନୁସନ୍ଧାନ କରିବା ସମୟରେ ଶିଶୁମାନେ ଅନ୍ୟମାନଙ୍କୁ ଆଘାତ ପହଞ୍ଚାଇ ପାରନ୍ତି। ସେମାନଙ୍କୁ ଧୀର ଭାବରେ ସ୍ପର୍ଶ କରିବା ଶିଖାନ୍ତୁ, ତା’ଙ୍କୁ ପାଟି କରନ୍ତୁ ନାହିଁ।' },
      { en: 'Tell stories and read picture books aloud. Show and name the things around the baby.', or: 'ଶିଶୁକୁ ବିଭିନ୍ନ ଗପ ସହ ଛବି ଥିବା ବହି ବଡ଼ ପାଟିରେ ପଢ଼ି ଶୁଣାନ୍ତୁ। ଶିଶୁର ପରିବେଶରେ ଥିବା ବସ୍ତୁଗୁଡ଼ିକୁ ଶିଶୁକୁ ଦେଖାନ୍ତୁ ଓ ସେଗୁଡ଼ିକର ନାମ କୁହନ୍ତୁ।' },
    ],
    warn: [
      { en: 'Cannot pick up small objects with finger and thumb', or: 'ଛୋଟ ଜିନିଷଗୁଡ଼ିକୁ ଆଙ୍ଗୁଠି ବା ବୁଢ଼ା ଆଙ୍ଗୁଠିର ବ୍ୟବହାର କରି ଉଠେଇ ପାରୁନାହିଁ' },
      { en: 'Does not stretch out the hands to be picked up', or: 'କୋଳେଇ ନେବା ପାଇଁ ହାତ ଉଠାଉ ନାହିଁ' },
      { en: 'Does not respond to own name', or: 'ଶିଶୁର ନା’ ଡାକିଲେ କିଛି ପ୍ରତିକ୍ରିୟା ଦେଖାଉନାହିଁ' },
      { en: 'Does not search for a half-hidden toy after watching you hide it', or: 'ଶିଶୁର ସାମ୍‌ନାରେ କିଛି ଖେଳଣା ଅଧା ଲୁଚେଇ ରଖିଲେ ତା’କୁ ଖୋଜିବାକୁ ଚେଷ୍ଟା କରୁନାହିଁ' },
      { en: 'Does not play social games like peek-a-boo', or: 'କୌଣସି ସାମାଜିକ ଖେଳ ଯେମିତି କି ଲୁଚକାଳି ଖେଳୁନାହିଁ' },
    ],
  },
  {
    k: 'm18', from: 13, at: 18,
    name: { en: 'By 18 months', or: '୧୮ ମାସ ବୟସ ଭିତରେ' }, atName: { en: 'At 18 months', or: '୧୮ ମାସ ବୟସରେ' },
    can: [
      { en: 'Stands and takes several steps alone', or: 'ନିଜେ ସ୍ୱାଧୀନ ଭାବେ ଠିଆ ହୋଇ କେତେକ ପାଦ ପକାଇ ଚାଲି ପାରୁଛି' },
      { en: 'Uses familiar gestures like waving and clapping', or: 'ବିଭିନ୍ନ ପ୍ରକାରର ସାମାଜିକ ଠାର ଯେପରିକି ‘ଟାଟା’ କରିବା, ତାଳି ମାରିବା, ଇତ୍ୟାଦି କରିପାରୁଛି' },
      { en: 'Puts pebbles or small objects into a container', or: 'ଛୋଟ ବସ୍ତୁ ବା ଗୋଡ଼ିଗୁଡ଼ିକୁ ଉଠାଇ ଗୋଟିଏ ପାତ୍ରରେ ରଖିପାରୁଛି' },
      { en: 'Names and identifies common objects and their pictures in a book', or: 'ସାଧାରଣ ବସ୍ତୁ ଦେଖି ବା ସେଗୁଡ଼ିକର ଛବି କୌଣସି ବହିରେ ଦେଖି, ସେଗୁଡ଼ିକୁ ଚିହ୍ନି ପାରୁଛି ଓ ତା’ ନା’ କହିପାରୁଛି' },
    ],
    tips: [
      { en: 'Give a push toy to help the child learn to walk.', or: 'ଶିଶୁକୁ ଠେଲିକି ଗଡ଼େଇ ଗଡ଼େଇ ନେଲା ପରି ଖେଳଣା ଦିଅନ୍ତୁ। ଏହା ସେମାନଙ୍କୁ ଚାଲିବା ଶିଖିବାରେ ସାହାଯ୍ୟ କରିଥାଏ।' },
      { en: 'Give fruits, toys and other things; ask the child to name them and to put them in and take them out of a container.', or: 'ଶିଶୁକୁ କିଛି ଫଳ, ଖେଳଣା, ଇତ୍ୟାଦି ଦିଅନ୍ତୁ। ସେମାନଙ୍କୁ ବସ୍ତୁଗୁଡ଼ିକୁ ଚିହ୍ନିବା ପାଇଁ ଓ ସେଗୁଡ଼ିକୁ ଏକ ପାତ୍ରରେ ପୁରେଇବା ପାଇଁ ଏବଂ ପାତ୍ରରୁ ବାହାର କରିବା ପାଇଁ କୁହନ୍ତୁ।' },
      { en: 'Ask the child simple questions and encourage the child to talk.', or: 'ଶିଶୁମାନଙ୍କୁ କିଛି ସହଜ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ ଏବଂ ସେମାନଙ୍କୁ କଥାବାର୍ତ୍ତା କରିବା ପାଇଁ ଉତ୍ସାହିତ କରନ୍ତୁ।' },
    ],
    warn: [
      { en: 'Cannot stand alone without support', or: 'ନିଜେ ସ୍ୱାଧୀନ ଭାବେ, ବିନା କୌଣସି ସହାୟତାରେ ଠିଆ ହୋଇପାରୁନାହିଁ' },
      { en: 'Cannot put small objects into a container', or: 'ଛୋଟ ଛୋଟ ବସ୍ତୁଗୁଡ଼ିକୁ ପାତ୍ରରେ ରଖି ପାରୁନାହିଁ' },
      { en: 'Does not point at an object when it is named', or: 'କୌଣସି ବସ୍ତୁ ବିଷୟରେ କହିଲେ ବା ପଚାରିଲେ ତା’ ଆଡ଼କୁ ଆଙ୍ଗୁଠି ଦେଖାଉନାହିଁ' },
      { en: "Does not respond to the mother's gestures and seems to be in a world of the child's own", or: 'ମା’ର ଠାରକୁ କିଛି ପ୍ରତିକ୍ରିୟା ଦେଖାଉନାହିଁ ଏବଂ ନିଜ ଦୁନିଆରେ ଥିଲା ପରି ରହୁଛି' },
      { en: 'Does not use both hands for everyday activities (prefers one hand)', or: 'ନିତିଦିନିଆ କାମ ପାଇଁ ଦୁଇ ହାତ ବ୍ୟବହାର କରୁନାହିଁ (କୌଣସି ଗୋଟିଏ ହାତ ପାଇଁ ଅଧିକ ଆଗ୍ରହ ଦେଖାଉଛି)' },
      { en: 'Does not say single words like "mama" or "dada"', or: '‘ମାମା’, ‘ବାବା’ ବା ‘ଦାଦା’ ପରି ଶବ୍ଦ କହୁ ନାହିଁ' },
    ],
  },
  {
    k: 'm24', from: 19, at: 24,
    name: { en: 'By 24 months', or: '୨୪ ମାସ ବୟସ ଭିତରେ' }, atName: { en: 'At 24 months', or: '୨୪ ମାସ ବୟସରେ' },
    can: [
      { en: 'Walks steadily, even while pulling a toy', or: 'ସ୍ଥିର ଭାବେ ଚାଲି ପାରୁଛି (କୌଣସି ଖେଳଣା ଟାଣିଲା ବେଳେ ମଧ୍ୟ)' },
      { en: 'Copies household chores', or: 'ବିଭିନ୍ନ ଦୈନନ୍ଦିନ କାର୍ଯ୍ୟକୁ ଅନୁକରଣ କରିପାରୁଛି' },
      { en: 'Points to and names one or more body parts, in person or in a book', or: 'ନିଜେ ବା ବହିରେ ଦେଖି ଶରୀରର ବିଭିନ୍ନ ଅଙ୍ଗର ନାମ ଠିକ୍ ଭାବରେ କହିପାରୁଛି' },
    ],
    tips: [
      { en: 'Let the child walk, run and climb in safe places.', or: 'ଶିଶୁକୁ ସୁରକ୍ଷିତ ପରିସ୍ଥିତି ଓ ପରିବେଶରେ ଚଲାଚଲି କରିବାକୁ, ଦୌଡ଼ାଦୌଡ଼ି କରିବାକୁ ଓ ଚଢ଼ାଚଢ଼ି କରିବାକୁ ସୁଯୋଗ ଦିଅନ୍ତୁ।' },
      { en: 'Let the child copy you and learn skills. Be patient if the child makes a mess.', or: 'ଶିଶୁକୁ ଆପଣଙ୍କର ଅନୁକରଣ କରି ନିଜର ଦକ୍ଷତା ବଢ଼ାଇବାର ସୁଯୋଗ ଦିଅନ୍ତୁ।' },
      { en: 'Keep a daily routine, such as sleeping and waking at fixed times.', or: 'ଶିଶୁକୁ ତା’ର ନିତ୍ୟକର୍ମ ଓ ଦୈନନ୍ଦିନ କାର୍ଯ୍ୟ ଯେପରିକି ଶୋଇବା ଓ ଉଠିବା ପ୍ରତ୍ୟେକ ଦିନ ଏକ ନିର୍ଦ୍ଦିଷ୍ଟ ସମୟରେ କରିବା ପାଇଁ ଉତ୍ସାହିତ କରନ୍ତୁ।' },
      { en: 'Read aloud often, repeating stories. Give books, paper, chalk and colours for scribbling.', or: 'ଶିଶୁକୁ ବଡ଼ ପାଟିରେ ବହି ପଢ଼ି ଶୁଣାନ୍ତୁ। ଗୋଟିଏ ଗପକୁ ବାରମ୍ବାର ଶିଶୁକୁ ପଢ଼ି ଶୁଣାନ୍ତୁ। ଶିଶୁକୁ ବିଭିନ୍ନ ବହି, ଖାତା, କାଗଜ, ଚକ୍ ଖଡ଼ି, ରଙ୍ଗ ଇତ୍ୟାଦି ଦିଅନ୍ତୁ ଯାହାର ପ୍ରୟୋଗ କରି ସିଏ ଏଣୁତେଣୁ ଲେଖାଲେଖି କରିବାକୁ ଚେଷ୍ଟା କରିବ।' },
    ],
    warn: [
      { en: 'Does not walk steadily while pulling a toy', or: 'କୌଣସି ଖେଳଣା ଟାଣିଲାବେଳେ ସ୍ଥିର ହୋଇ ଚାଲି ପାରୁନାହିଁ' },
      { en: 'Cannot scribble', or: 'ଏଣୁତେଣୁ ଲେଖାଲେଖି ବା ଗାରାଗାରି କରିପାରୁନାହିଁ' },
      { en: 'Does not use two-word phrases like "give milk"', or: 'ଦି ଶବ୍ଦିଆ ବାକ୍ୟ ଯେପରିକି “କ୍ଷୀର ଦିଅ” ଇତ୍ୟାଦି କହିପାରୁନାହିଁ' },
      { en: 'Does not respond to gestures like bye-bye or namaste', or: 'ବିଭିନ୍ନ ଠାର ଯେପରିକି ଟା-ଟା, ନମସ୍କାର, ଇତ୍ୟାଦିର କୌଣସି ପ୍ରତିକ୍ରିୟା ଦେଉନାହିଁ' },
      { en: 'Does not point to body parts', or: 'ଶରୀରର ବିଭିନ୍ନ ଅଙ୍ଗକୁ ଚିହ୍ନି ଦେଖେଇ ପାରୁନାହିଁ' },
      { en: 'Does not seem to understand or follow simple instructions', or: 'ମନେ ହୁଏ ଯେପରି କୌଣସି ସହଜ ଆଦେଶଗୁଡ଼ିକୁ ବୁଝିପାରୁନାହିଁ ବା ଅନୁସରଣ କରିପାରୁନାହିଁ' },
    ],
  },
  {
    k: 'y3', from: 25, at: 36,
    name: { en: 'By 3 years', or: '୩ ବର୍ଷ ବୟସ ଭିତରେ' }, atName: { en: 'At 3 years', or: '୩ ବର୍ଷ ବୟସରେ' },
    can: [
      { en: 'Drinks from a cup without spilling', or: 'ବାହାରେ ନ ପକେଇ କୌଣସି ପାତ୍ରରେ ପିଇପାରୁଛି' },
      { en: 'Climbs up and down stairs', or: 'ସିଢ଼ି ଚଢ଼ିପାରୁଛି ଓ ଓହ୍ଲେଇ ପାରୁଛି' },
      { en: 'Names most familiar things; knows colours and shapes', or: 'ପରିଚିତ ବସ୍ତୁ ଗୁଡ଼ିକର ନାମ ସୁସଂଗତ ଭାବେ କହିପାରୁଛି। ବିଭିନ୍ନ ରଙ୍ଗ ଓ ଆକାରଗୁଡ଼ିକୁ ଚିହ୍ନି ପାରୁଛି।' },
      { en: 'Makes sentences of 3 or more words', or: '୩ ବା ୩ ରୁ ଅଧିକ ଶବ୍ଦ ଯୋଡ଼ି ବାକ୍ୟ ଗଠନ କରିପାରୁଛି' },
    ],
    tips: [
      { en: 'Play outdoor games that need movement and physical activity.', or: 'ଶିଶୁ ସହିତ ବିଭିନ୍ନ ବାହ୍ୟ କ୍ରୀଡ଼ା ଖେଳନ୍ତୁ ଯାହା ଦ୍ୱାରା ଶିଶୁର ଶାରୀରିକ କସରତ ହୋଇଥାଏ।' },
      { en: 'Give a variety of things to play with: blocks, puzzles, rings.', or: 'ଶିଶୁକୁ ବିଭିନ୍ନ ପ୍ରକାରର ବସ୍ତୁ ବା ଖେଳଣା ଖେଳିବାକୁ ଦିଅନ୍ତୁ।' },
      { en: 'Let the child use hands and fingers in different ways to build skills.', or: 'ଶିଶୁକୁ ନିଜର ହାତ ଓ ଆଙ୍ଗୁଠି ବିଭିନ୍ନ ପ୍ରକାରରେ ବ୍ୟବହାର କରିବାକୁ ଦିଅନ୍ତୁ। ଏହା ଦ୍ୱାରା ସେମାନଙ୍କର ଦକ୍ଷତା ବଢ଼ିଥାଏ।' },
    ],
    warn: [
      { en: 'Has trouble climbing up and down stairs', or: 'ସିଢ଼ି ଚଢ଼ିବା ବା ଓହ୍ଲେଇବାରେ କଷ୍ଟ ହେଉଛି' },
      { en: 'Cannot eat without help', or: 'ବିନା ସାହାଯ୍ୟରେ ଖାଇପାରୁ ନାହିଁ' },
      { en: "Does not talk meaningfully and often repeats others' words", or: 'ସଠିକ୍ ଭାବେ କହିପାରୁନାହିଁ ଏବଂ ଅନ୍ୟମାନେ କହୁଥିବା ଶବ୍ଦକୁ ବାରମ୍ବାର ବ୍ୟବହାର କରୁଛି' },
      { en: 'Does not play pretend games (such as feeding a doll)', or: 'ଖେଳଣା, ଘରକରଣା ଜିନିଷ ବ୍ୟବହାର କରି ଖେଳୁନାହିଁ' },
      { en: 'Drools all the time; speech is unclear', or: 'ପାଟିରୁ ସବୁବେଳେ ଲାଳ ବୋହୁଛି ଓ ସଠିକ୍ ଭାବରେ ଉଚ୍ଚାରଣ କରିପାରୁନାହିଁ' },
      { en: 'Does not speak in short sentences like "mummy give milk"', or: 'ସହଜ ଓ ଛୋଟ ବାକ୍ୟ ଯେପରିକି “ମା’ ମୋତେ କ୍ଷୀର ଦିଅ” କହିପାରୁ ନାହିଁ' },
    ],
  },
];
K.dev.TEXT = {
  canHead: { en: 'What most children can do (mother ticks)', or: 'ସାଧାରଣତଃ ଶିଶୁମାନେ କ’ଣ କରିପାରନ୍ତି (ମା’ ଚିହ୍ନ ଦେବେ)' },
  tipsHead: { en: 'Parenting tips', or: 'ଶିଶୁର ଲାଳନପାଳନ ସମ୍ବନ୍ଧୀୟ ସୂଚନା' },
  warnHead: { en: 'Warning signs (checked by ASHA / AWW)', or: '‘ସତର୍କତା’ର ଲକ୍ଷଣ (ଆଶା / ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀ ଯାଞ୍ଚ କରିବେ)' },
  warnLead: { en: 'If you see any one of these, contact the AWW or health worker at once, or call 104.', or: 'ଏଥି ମଧ୍ୟରୁ କୌଣସି ଗୋଟିଏ ଲକ୍ଷଣ ଦେଖିବା ମାତ୍ରେ, ନିକଟସ୍ଥ ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀ ବା ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କୁ ତୁରନ୍ତ ଯୋଗାଯୋଗ କରନ୍ତୁ କିମ୍ବା ‘୧୦୪’କୁ ଫୋନ୍ କରନ୍ତୁ।' },
  deic: { en: 'District Early Intervention Centre (DEIC)', or: 'ଡି.ଇ.ଆଇ.ସି. (DEIC)' },
  deicBody: { en: 'Birth defects, developmental delay and disability are picked up early and treated free by specialists at the DEIC in the district headquarters hospital (also at Sishu Bhawan Cuttack, RGH Rourkela and Capital Hospital Bhubaneswar). Services include physiotherapy and help for learning and thinking skills.', or: 'ଶିଶୁମାନଙ୍କଠାରେ ଥିବା ଜନ୍ମଗତ ତ୍ରୁଟି, ବିଳମ୍ବିତ ବିକାଶ ଓ ଅକ୍ଷମତାର ସଅଳ ଚିହ୍ନଟିକରଣ ଓ ଚିକିତ୍ସା ଡି.ଇ.ଆଇ.ସି.ରେ ଅଭିଜ୍ଞ ବିଶେଷଜ୍ଞମାନଙ୍କ ଦ୍ୱାରା ମାଗଣାରେ କରାଯାଏ। ଡି.ଇ.ଆଇ.ସି. ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, ଶିଶୁଭବନ କଟକ, ଆର.ଜି.ଏଚ୍. ରାଉରକେଲା ଏବଂ କ୍ୟାପିଟାଲ ହସ୍ପିଟାଲରେ କାର୍ଯ୍ୟ କରୁଛି। ଫିଜିଓଥେରାପି ଓ ବୌଦ୍ଧିକ ବିକାଶ ପାଇଁ ଚିକିତ୍ସା ମିଳେ।' },
};
