// All notes live here. Each chapter: id -> content.
// Later the Admin Panel will write this data for you.
window.NOTES = {
  "historical-background": {
    subject:"polity", read:"12 min read", exams:["SSC CGL","CHSL","MTS"],
    title:"Historical Background of the Indian Constitution",
    intro:"Our Constitution did not appear in 1950 from nothing. Many of its features grew out of laws passed by the British Parliament between 1773 and 1947. These Acts are asked again and again in SSC and State PCS exams, mostly as \"which Act introduced what\". Learn them in order and the questions become easy.",
    phases:[
      {h:"Company Rule (1773–1858)", items:[
        {yr:"1773", t:"Regulating Act", s:"First step by British Parliament to control the East India Company", pts:[
          "Governor of Bengal became the Governor-General of Bengal. First was Lord Warren Hastings.",
          "Executive Council of 4 members to assist him.",
          "Governors of Bombay and Madras made subordinate to Bengal.",
          "Supreme Court set up at Calcutta in 1774."]},
        {yr:"1784", t:"Pitt's India Act", pts:[
          "Separated commercial and political functions of the Company.",
          "Court of Directors kept trade; new Board of Control handled political affairs.",
          "This created the system of double government.",
          "Company territories called \"British possessions in India\" for the first time."]},
        {yr:"1813", t:"Charter Act of 1813", pts:[
          "Ended the Company's trade monopoly in India, except trade in tea and with China.",
          "Christian missionaries allowed to come to India."]},
        {yr:"1833", t:"Charter Act of 1833", s:"Final step towards centralisation", pts:[
          "Governor-General of Bengal became Governor-General of India. First was Lord William Bentinck.",
          "Ended the Company's commercial activities completely; it became a purely administrative body.",
          "Bombay and Madras lost their legislative powers."]},
        {yr:"1853", t:"Charter Act of 1853", s:"Last of the Charter Acts", pts:[
          "Separated legislative and executive functions of the Governor-General's Council.",
          "Introduced open competition for selection of civil servants. Macaulay Committee formed in 1854.",
          "Local representation introduced in the Indian Legislative Council for the first time."]}
      ]},
      {h:"Crown Rule (1858–1947)", items:[
        {yr:"1858", t:"Government of India Act 1858", s:"Act for the Good Government of India, passed after the Revolt of 1857", pts:[
          "Rule passed from the Company to the British Crown.",
          "Governor-General of India also titled Viceroy. First Viceroy was Lord Canning.",
          "New office of Secretary of State for India, helped by a 15-member Council of India.",
          "Board of Control and Court of Directors abolished, ending double government."]},
        {yr:"1861", t:"Indian Councils Act 1861", pts:[
          "Viceroy could nominate Indians as non-official members. Lord Canning nominated the Raja of Benaras, the Maharaja of Patiala and Sir Dinkar Rao.",
          "Restored legislative powers to Bombay and Madras, beginning decentralisation.",
          "Recognised the portfolio system introduced by Lord Canning.",
          "Viceroy could issue ordinances in an emergency."]},
        {yr:"1892", t:"Indian Councils Act 1892", pts:[
          "Councils could discuss the budget and ask questions to the executive.",
          "Limited, indirect election introduced for some non-official seats (the word \"election\" was not used)."]},
        {yr:"1909", t:"Morley-Minto Reforms", s:"Indian Councils Act 1909", pts:[
          "Separate electorate for Muslims. Lord Minto is called the Father of Communal Electorate.",
          "Satyendra Prasad Sinha became the first Indian in the Viceroy's Executive Council (as Law Member).",
          "Size of legislative councils increased."]},
        {yr:"1919", t:"Montagu-Chelmsford Reforms", s:"Government of India Act 1919", pts:[
          "Dyarchy in the provinces: subjects split into transferred and reserved.",
          "Bicameral legislature at the Centre for the first time, with direct elections.",
          "Separate electorate extended to Sikhs, Indian Christians, Anglo-Indians and Europeans.",
          "Provided for a Public Service Commission; Central PSC set up in 1926."]},
        {yr:"1935", t:"Government of India Act 1935", s:"Longest Act; the base of our Constitution", pts:[
          "Proposed an All-India Federation of provinces and princely states (never came into force).",
          "Three lists: Federal, Provincial and Concurrent.",
          "Abolished dyarchy in provinces, gave provincial autonomy; dyarchy moved to the Centre.",
          "Set up the RBI, Federal Court (1937) and Federal, Provincial and Joint PSCs."]},
        {yr:"1947", t:"Indian Independence Act 1947", s:"Based on the Mountbatten Plan", pts:[
          "Ended British rule; India became independent on 15 August 1947.",
          "Partition into India and Pakistan, each free to leave the Commonwealth.",
          "Office of Viceroy abolished; Governor-General became the constitutional head.",
          "Constituent Assembly given full power to frame and adopt any constitution."]}
      ]}
    ],
    tableTitle:"Important firsts", tableHead:["Year","Post","Person"],
    table:[
      ["1773","First Governor-General of Bengal","Warren Hastings"],
      ["1833","First Governor-General of India","Lord William Bentinck"],
      ["1858","First Viceroy of India","Lord Canning"],
      ["1909","First Indian in Viceroy's Executive Council","Satyendra Prasad Sinha"],
      ["1947","First Governor-General of free India","Lord Mountbatten"]
    ],
    tricks:[
      "Charter Acts come every 20 years: 1793, 1813, 1833, 1853.",
      "Dyarchy: 1919 brought it to the provinces, 1935 moved it to the Centre.",
      "Separate electorate: 1909 for Muslims, 1919 extended to four more communities.",
      "\"Bengal\" to \"India\": the title change happened in 1833."
    ],
    quiz:[
      {q:"Which Act introduced dyarchy in the provinces?", tag:"Asked in SSC CGL", opts:["Indian Councils Act 1909","Government of India Act 1919","Government of India Act 1935","Charter Act 1853"], a:1, why:"The Montagu-Chelmsford Reforms (1919) split provincial subjects into transferred and reserved. The 1935 Act removed it from provinces and brought it to the Centre."},
      {q:"Who was the first Governor-General of India?", tag:"Asked in SSC CHSL", opts:["Warren Hastings","Lord Canning","Lord William Bentinck","Lord Cornwallis"], a:2, why:"The Charter Act of 1833 changed the title to Governor-General of India. Warren Hastings was Governor-General of Bengal under the 1773 Act."},
      {q:"Separate electorate for Muslims was introduced by", tag:"Practice", opts:["Morley-Minto Reforms 1909","Indian Councils Act 1892","Pitt's India Act 1784","Indian Independence Act 1947"], a:0, why:"The Indian Councils Act 1909 brought communal representation, which is why Lord Minto is called the Father of Communal Electorate."},
      {q:"The Reserve Bank of India was set up under which Act?", tag:"Practice", opts:["Government of India Act 1919","Government of India Act 1935","Government of India Act 1858","Charter Act 1833"], a:1, why:"The 1935 Act provided for the RBI, which began working in 1935."}
    ]
  },

  "making": {
    subject:"polity", read:"11 min read", exams:["SSC CGL","CHSL","MTS"],
    title:"Making of the Constitution",
    intro:"The Constitution of India was framed by a Constituent Assembly that worked from December 1946 to January 1950. Exams love the dates, the numbers (389, 299, 284) and the committees with their chairmen. This note puts all of them in one place.",
    phases:[
      {h:"Demand for a Constituent Assembly", items:[
        {yr:"1934", t:"Idea first put forward", pts:["M.N. Roy, a pioneer of the communist movement in India, first gave the idea of a Constituent Assembly."]},
        {yr:"1935", t:"Official demand by Congress", pts:["The Indian National Congress officially demanded a Constituent Assembly to frame India's constitution."]},
        {yr:"1938", t:"Nehru's declaration", pts:["Jawaharlal Nehru declared that the constitution of free India must be framed by a Constituent Assembly elected on adult franchise, without outside interference."]},
        {yr:"1940", t:"August Offer", pts:["The British Government accepted the demand in principle for the first time."]},
        {yr:"1942", t:"Cripps Mission", pts:["Sir Stafford Cripps brought a draft proposal for an elected constitution-making body after the war. The Muslim League rejected it."]}
      ]},
      {h:"Formation (Cabinet Mission Plan, 1946)", items:[
        {yr:"389", t:"Total strength", s:"As per the Cabinet Mission Plan", pts:[
          "296 seats for British India: 292 from the Governors' provinces and 4 from the Chief Commissioners' provinces.",
          "93 seats for the princely states.",
          "Roughly one seat per 10 lakh population."]},
        {yr:"1946", t:"Elections (July–August)", pts:[
          "Members from British India were indirectly elected by the provincial legislative assemblies.",
          "Congress won 208 seats, Muslim League 73, and small groups and independents 15.",
          "The princely states stayed away at first; their representatives were to be nominated by the rulers.",
          "The Assembly was partly elected and partly nominated, but it had members from all communities and sections."]}
      ]},
      {h:"Working of the Assembly", items:[
        {yr:"9 Dec 1946", t:"First meeting", pts:[
          "211 members attended; the Muslim League boycotted it and demanded a separate Pakistan.",
          "Dr Sachchidananda Sinha, the oldest member, was the temporary President (following French practice)."]},
        {yr:"11 Dec 1946", t:"Permanent President", pts:[
          "Dr Rajendra Prasad elected President of the Assembly.",
          "H.C. Mukherjee and V.T. Krishnamachari were Vice-Presidents.",
          "Sir B.N. Rau was appointed Constitutional Advisor."]},
        {yr:"13 Dec 1946", t:"Objectives Resolution", pts:[
          "Moved by Jawaharlal Nehru; it laid down the philosophy of the Constitution.",
          "Adopted unanimously on 22 January 1947. Its modified form became the Preamble."]},
        {yr:"1947", t:"Changes by the Independence Act", pts:[
          "The Assembly became fully sovereign and could change any law made by the British Parliament.",
          "It also became India's first Parliament (Dominion Legislature). As a legislature it was chaired by G.V. Mavalankar; as a constitution-making body by Dr Rajendra Prasad.",
          "After Partition, members from Pakistan areas left and the strength fell to 299."]},
        {yr:"29 Aug 1947", t:"Drafting Committee set up", s:"7 members, chaired by Dr B.R. Ambedkar", pts:[
          "Members: Dr B.R. Ambedkar (Chairman), N. Gopalaswamy Ayyangar, Alladi Krishnaswamy Ayyar, Dr K.M. Munshi, Syed Mohammad Saadullah, N. Madhava Rau (in place of B.L. Mitter) and T.T. Krishnamachari (in place of D.P. Khaitan, who died in 1948).",
          "First draft published in February 1948; people had 8 months to suggest changes."]},
        {yr:"26 Nov 1949", t:"Constitution adopted", pts:[
          "Passed after three readings; the Preamble mentions this date.",
          "Original Constitution: Preamble, 395 Articles, 22 Parts and 8 Schedules.",
          "Since 2015, 26 November is celebrated as Constitution Day (Samvidhan Divas)."]},
        {yr:"24 Jan 1950", t:"Final session", pts:[
          "284 members signed the Constitution.",
          "Dr Rajendra Prasad elected the first President of India.",
          "National Anthem and National Song adopted the same day."]},
        {yr:"26 Jan 1950", t:"Constitution came into force", pts:[
          "This date was chosen because Purna Swaraj Day was celebrated on 26 January 1930.",
          "Some provisions on citizenship, elections, provisional Parliament and temporary provisions came into force earlier, on 26 November 1949.",
          "Total time taken: 2 years, 11 months and 18 days; 11 sessions spread over 165 days; cost about ₹64 lakh."]}
      ]}
    ],
    tableTitle:"Major committees and chairmen", tableHead:["Committee","Chairman",""],
    table:[
      ["Drafting Committee","Dr B.R. Ambedkar",""],
      ["Union Powers Committee","Jawaharlal Nehru",""],
      ["Union Constitution Committee","Jawaharlal Nehru",""],
      ["States Committee (talks with states)","Jawaharlal Nehru",""],
      ["Provincial Constitution Committee","Sardar Patel",""],
      ["Advisory Committee on Fundamental Rights, Minorities and Tribal Areas","Sardar Patel",""],
      ["Fundamental Rights Sub-Committee","J.B. Kripalani",""],
      ["Minorities Sub-Committee","H.C. Mukherjee",""],
      ["Rules of Procedure / Steering Committee","Dr Rajendra Prasad",""],
      ["Ad hoc Committee on National Flag","Dr Rajendra Prasad",""]
    ],
    tricks:[
      "Numbers in order: 389 (planned) → 299 (after Partition) → 284 (signed).",
      "Nehru chaired the \"Union\" committees and the States Committee; Patel chaired the \"Provincial\" and \"Advisory\" ones.",
      "Two Presidents: Sachchidananda Sinha was temporary (9 Dec), Rajendra Prasad permanent (11 Dec).",
      "Adopted 26 Nov 1949, enforced 26 Jan 1950. The elephant was adopted as the Assembly's seal.",
      "Original handwriting (calligraphy) by Prem Behari Narain Raizada; pages decorated by artists of Shantiniketan led by Nandalal Bose."
    ],
    quiz:[
      {q:"Who first put forward the idea of a Constituent Assembly for India?", tag:"Asked in SSC CGL", opts:["Jawaharlal Nehru","M.N. Roy","Mahatma Gandhi","B.R. Ambedkar"], a:1, why:"M.N. Roy gave the idea in 1934. Congress made it an official demand in 1935."},
      {q:"Who was the temporary President of the Constituent Assembly?", tag:"Asked in SSC CHSL", opts:["Dr Rajendra Prasad","H.C. Mukherjee","Dr Sachchidananda Sinha","G.V. Mavalankar"], a:2, why:"As the oldest member, Dr Sachchidananda Sinha presided over the first meeting on 9 December 1946. Rajendra Prasad became permanent President on 11 December."},
      {q:"The Objectives Resolution was moved by", tag:"Practice", opts:["Sardar Patel","B.R. Ambedkar","Jawaharlal Nehru","Rajendra Prasad"], a:2, why:"Nehru moved it on 13 December 1946 and it was adopted on 22 January 1947. It later became the Preamble."},
      {q:"Who chaired the Provincial Constitution Committee?", tag:"Asked in SSC CGL", opts:["Jawaharlal Nehru","Sardar Vallabhbhai Patel","J.B. Kripalani","B.R. Ambedkar"], a:1, why:"Patel chaired the Provincial Constitution Committee and the Advisory Committee. Nehru chaired the Union Powers and Union Constitution Committees."},
      {q:"How many Articles did the original Constitution have?", tag:"Practice", opts:["395","448","390","365"], a:0, why:"The original Constitution had 395 Articles in 22 Parts and 8 Schedules."}
    ]
  },

  "preamble": {
    subject:"polity", read:"9 min read", exams:["SSC CGL","CHSL","MTS"],
    title:"Preamble of the Indian Constitution",
    intro:"The Preamble is the introduction to the Constitution. It tells us who gave the Constitution, what kind of state India is, what it wants to achieve and when it was adopted. It is based on Nehru's Objectives Resolution and has been amended only once.",
    phases:[
      {h:"Four things the Preamble reveals", items:[
        {yr:"Source", t:"Source of authority", pts:["\"We, the People of India\": the Constitution draws its power from the people."]},
        {yr:"Nature", t:"Nature of the Indian State", pts:["Sovereign, Socialist, Secular, Democratic and Republic."]},
        {yr:"Aim", t:"Objectives", pts:["Justice, Liberty, Equality and Fraternity."]},
        {yr:"Date", t:"Date of adoption", pts:["26 November 1949."]}
      ]},
      {h:"Keywords explained", items:[
        {yr:"S", t:"Sovereign", pts:["India is neither a dependency nor a dominion of any other nation. It is free to manage its internal and external affairs.","Membership of the Commonwealth or the UN does not affect this."]},
        {yr:"S", t:"Socialist", s:"Added in 1976", pts:["Indian socialism is democratic socialism, not communistic socialism.","It aims to end poverty, ignorance, disease and inequality of opportunity, within a mixed economy."]},
        {yr:"S", t:"Secular", s:"Added in 1976", pts:["All religions get equal respect and support from the State (positive secularism).","The State has no official religion."]},
        {yr:"D", t:"Democratic", pts:["Power lies with the people. India has representative parliamentary democracy.","The Preamble covers political, social and economic democracy."]},
        {yr:"R", t:"Republic", pts:["The head of the State (President) is elected, indirectly, for a fixed term of 5 years, and is not hereditary.","Every public office is open to every citizen."]},
        {yr:"J", t:"Justice", s:"Social, economic and political", pts:["Taken from the Russian Revolution (1917)."]},
        {yr:"L", t:"Liberty", s:"Of thought, expression, belief, faith and worship", pts:["Liberty, Equality and Fraternity are taken from the French Revolution (1789–1799)."]},
        {yr:"E", t:"Equality", s:"Of status and of opportunity", pts:["No special privileges to any section; equal chances for all."]},
        {yr:"F", t:"Fraternity", s:"Assuring the dignity of the individual and the unity and integrity of the Nation", pts:["The word \"integrity\" was added in 1976."]}
      ]},
      {h:"Amendment and court cases", items:[
        {yr:"1976", t:"42nd Amendment Act", s:"The only amendment so far", pts:["Added three words: Socialist, Secular and Integrity.","Passed during the Emergency, on the recommendation of the Swaran Singh Committee."]},
        {yr:"1960", t:"Berubari Union case", pts:["Supreme Court said the Preamble is NOT a part of the Constitution.","It agreed that the Preamble shows the general purpose behind the provisions."]},
        {yr:"1973", t:"Kesavananda Bharati case", pts:["Supreme Court reversed its view: the Preamble IS a part of the Constitution.","It can be amended under Article 368, but the basic structure cannot be changed."]},
        {yr:"1995", t:"LIC of India case", pts:["Supreme Court again held that the Preamble is an integral part of the Constitution."]},
        {yr:"Note", t:"Not enforceable in court", pts:["The Preamble is non-justiciable: its words cannot be enforced in a court of law.","It is neither a source of power to the legislature nor a limit on its powers."]}
      ]}
    ],
    tableTitle:"Famous descriptions of the Preamble", tableHead:["Person","Called it",""],
    table:[
      ["N.A. Palkhivala","Identity card of the Constitution",""],
      ["K.M. Munshi","Horoscope of our sovereign democratic republic",""],
      ["Thakur Das Bhargava","Soul of the Constitution",""],
      ["Ernest Barker","Key-note to the Constitution",""],
      ["M. Hidayatullah","Like the Declaration of Independence of the USA",""]
    ],
    tricks:[
      "SSSDR for the nature of the State: Sovereign, Socialist, Secular, Democratic, Republic.",
      "JLEF for the objectives: Justice, Liberty, Equality, Fraternity.",
      "Justice from Russia; Liberty, Equality, Fraternity from France; the idea of a Preamble from the USA.",
      "Court flip: 1960 \"not a part\" → 1973 \"a part\" → 1995 confirmed \"a part\".",
      "42nd Amendment = 3 new words (Socialist, Secular, Integrity) in 1976."
    ],
    quiz:[
      {q:"Which words were added to the Preamble by the 42nd Amendment?", tag:"Asked in SSC CGL", opts:["Sovereign, Socialist, Secular","Socialist, Secular, Integrity","Secular, Democratic, Unity","Socialist, Republic, Integrity"], a:1, why:"The 42nd Amendment Act, 1976 added Socialist, Secular and Integrity. It is the only amendment to the Preamble so far."},
      {q:"In which case did the Supreme Court hold that the Preamble is a part of the Constitution?", tag:"Practice", opts:["Berubari Union case","Golaknath case","Kesavananda Bharati case","Minerva Mills case"], a:2, why:"In Kesavananda Bharati (1973) the Court said the Preamble is a part of the Constitution, reversing its 1960 Berubari opinion."},
      {q:"Who called the Preamble the \"identity card of the Constitution\"?", tag:"Asked in SSC CHSL", opts:["K.M. Munshi","N.A. Palkhivala","B.R. Ambedkar","Ernest Barker"], a:1, why:"N.A. Palkhivala used this phrase. K.M. Munshi called it the horoscope of our sovereign democratic republic."},
      {q:"The ideals of Liberty, Equality and Fraternity in the Preamble are taken from", tag:"Asked in SSC MTS", opts:["American Revolution","Russian Revolution","French Revolution","Irish Constitution"], a:2, why:"They come from the French Revolution. The ideal of social, economic and political justice comes from the Russian Revolution."},
      {q:"The date of adoption mentioned in the Preamble is", tag:"Practice", opts:["26 January 1950","15 August 1947","26 November 1949","9 December 1946"], a:2, why:"The Preamble says the Constitution was adopted on 26 November 1949. It came into force on 26 January 1950."}
    ]
  }
};
window.NOTES["salient-features"] = {
  subject: "polity", read: "12 min read", exams: ["SSC CGL", "CHSL", "MTS", "GD"],
  title: "Salient Features of the Constitution",
  intro: "The Indian Constitution is unique in many ways. It is the longest written constitution in the world, it borrows the best features from many countries, and it mixes ideas that look opposite, like federal and unitary, rigid and flexible. SSC mostly asks which feature came from which country, so the sources table below is the most important part of this chapter.",
  phases: [
    { h: "Structure and nature", items: [
      { yr: "01", t: "Lengthiest written constitution", pts: [
        "Original Constitution: a Preamble, 395 Articles in 22 Parts, and 8 Schedules.",
        "Today it has about 470 Articles in 25 Parts, and 12 Schedules, after many amendments.",
        "Reasons for its length: India's size and diversity, one constitution for the Centre and the states, and many details borrowed from the Government of India Act 1935."]},
      { yr: "02", t: "Drawn from various sources", s: "Called a \"bag of borrowings\" by critics", pts: [
        "The structural part comes largely from the Government of India Act 1935.",
        "The philosophical part (Fundamental Rights, DPSP) comes from the American and Irish constitutions.",
        "The political part (cabinet government, Parliament) comes from the British constitution."]},
      { yr: "03", t: "Blend of rigidity and flexibility", s: "Article 368", pts: [
        "Some provisions change by a simple majority of Parliament.",
        "Some need a special majority of Parliament.",
        "Some need a special majority plus ratification by half of the state legislatures."]},
      { yr: "04", t: "Federal system with a unitary bias", pts: [
        "Federal features: two governments, division of powers, written and rigid constitution, independent judiciary, bicameral Parliament.",
        "Unitary features: strong Centre, single constitution, single citizenship, all-India services, emergency provisions, appointment of Governors by the Centre.",
        "The word \"federation\" is not used. Article 1 calls India a \"Union of States\".",
        "K.C. Wheare called it \"quasi-federal\"."]}
    ]},
    { h: "Government and judiciary", items: [
      { yr: "05", t: "Parliamentary form of government", s: "Westminster model, taken from Britain", pts: [
        "The President is the nominal head; the Prime Minister and Council of Ministers hold real power.",
        "Ministers are collectively responsible to the Lok Sabha.",
        "Used at the Centre and in the states."]},
      { yr: "06", t: "Parliamentary sovereignty + judicial supremacy", pts: [
        "Britain has parliamentary sovereignty; the USA has judicial supremacy.",
        "India mixes both: the Supreme Court can strike down laws (judicial review), and Parliament can amend most of the Constitution."]},
      { yr: "07", t: "Integrated and independent judiciary", pts: [
        "One single system of courts: Supreme Court at the top, High Courts below, then subordinate courts.",
        "Independence is protected by security of tenure, fixed service conditions and separation from the executive."]}
    ]},
    { h: "Rights, duties and democracy", items: [
      { yr: "08", t: "Fundamental Rights", s: "Part III, Articles 12–35", pts: [
        "Six Fundamental Rights today: Equality, Freedom, against Exploitation, Freedom of Religion, Cultural and Educational, and Constitutional Remedies.",
        "There were seven originally. The Right to Property was removed by the 44th Amendment Act, 1978 and is now a legal right under Article 300A.",
        "They are justiciable: you can go to court if they are violated."]},
      { yr: "09", t: "Directive Principles of State Policy", s: "Part IV, Articles 36–51", pts: [
        "Dr B.R. Ambedkar called them a \"novel feature\" of the Constitution.",
        "They are non-justiciable: courts cannot enforce them, but they guide the government in making laws."]},
      { yr: "10", t: "Fundamental Duties", s: "Part IV-A, Article 51A", pts: [
        "Added by the 42nd Amendment Act, 1976, on the recommendation of the Swaran Singh Committee.",
        "There were 10 duties originally; the 86th Amendment Act, 2002 added the 11th (education of children aged 6–14).",
        "Not in the original Constitution."]},
      { yr: "11", t: "A secular state", pts: [
        "The State has no official religion and treats all religions equally.",
        "The word \"secular\" was added to the Preamble by the 42nd Amendment, 1976."]},
      { yr: "12", t: "Universal adult franchise", pts: [
        "Every citizen aged 18 or above can vote, without any discrimination.",
        "The voting age was reduced from 21 to 18 by the 61st Amendment Act, 1988."]},
      { yr: "13", t: "Single citizenship", pts: [
        "All Indians are citizens of India only. There is no separate state citizenship (unlike the USA).",
        "Taken from the British constitution."]}
    ]},
    { h: "Special provisions", items: [
      { yr: "14", t: "Independent bodies", pts: [
        "Election Commission, Comptroller and Auditor General (CAG), Union Public Service Commission and State Public Service Commissions."]},
      { yr: "15", t: "Emergency provisions", pts: [
        "National Emergency (Article 352), President's Rule in states (Article 356) and Financial Emergency (Article 360).",
        "During an emergency the federal structure becomes unitary."]},
      { yr: "16", t: "Three-tier government", pts: [
        "The 73rd Amendment Act, 1992 gave constitutional status to Panchayats (Part IX).",
        "The 74th Amendment Act, 1992 did the same for Municipalities (Part IX-A)."]},
      { yr: "17", t: "Co-operative societies", pts: [
        "The 97th Amendment Act, 2011 gave constitutional status to co-operative societies (Part IX-B).",
        "Forming co-operative societies became a Fundamental Right under Article 19."]}
    ]}
  ],
  tableTitle: "Borrowed features and their sources (most asked)",
  tableHead: ["Source", "Features taken"],
  table: [
    ["Government of India Act 1935", "Federal scheme, office of Governor, judiciary, Public Service Commissions, emergency provisions, administrative details"],
    ["Britain", "Parliamentary government, rule of law, law-making procedure, single citizenship, cabinet system, writs, parliamentary privileges, bicameralism"],
    ["USA", "Fundamental Rights, independent judiciary, judicial review, impeachment of the President, removal of Supreme Court and High Court judges, post of Vice-President"],
    ["Ireland", "Directive Principles of State Policy, nomination of members to Rajya Sabha, method of electing the President"],
    ["Canada", "Federation with a strong Centre, residuary powers with the Centre, Centre appoints state Governors, advisory jurisdiction of the Supreme Court"],
    ["Australia", "Concurrent List, freedom of trade, commerce and intercourse, joint sitting of both Houses of Parliament"],
    ["Germany (Weimar)", "Suspension of Fundamental Rights during an Emergency"],
    ["USSR (Russia)", "Fundamental Duties, ideal of social, economic and political justice in the Preamble"],
    ["France", "Republic, ideals of liberty, equality and fraternity in the Preamble"],
    ["South Africa", "Procedure for amending the Constitution, election of members of Rajya Sabha"],
    ["Japan", "Procedure established by law"]
  ],
  tricks: [
    "DPSP from Ireland: think \"I DIRect\" – Ireland → DIRective Principles.",
    "Duties from the USSR, Rights from the USA: Rights = USA, Duties = USSR.",
    "Concurrent List and joint sitting both come from Australia.",
    "Emergency rule from the 1935 Act; suspension of rights in Emergency from Germany (Weimar).",
    "Amendment numbers: 42nd (1976) duties + secular, 44th (1978) property removed, 61st (1988) vote at 18, 73rd/74th (1992) Panchayats/Municipalities, 86th (2002) 11th duty, 97th (2011) co-operatives."
  ],
  quiz: [
    { q: "The idea of Directive Principles of State Policy was borrowed from the constitution of", tag: "Asked in SSC CGL", opts: ["USA", "Ireland", "Canada", "Australia"], a: 1, why: "DPSP come from the Irish Constitution, which itself took them from the Spanish Constitution." },
    { q: "The concept of the Concurrent List is taken from", tag: "Asked in SSC CHSL", opts: ["Canada", "Australia", "Japan", "Britain"], a: 1, why: "Australia gave us the Concurrent List, freedom of trade and commerce, and the joint sitting of both Houses." },
    { q: "Which country's constitution gave India the Fundamental Duties?", tag: "Asked in SSC MTS", opts: ["USA", "Britain", "USSR (Russia)", "France"], a: 2, why: "Fundamental Duties come from the erstwhile USSR. They were added in 1976 by the 42nd Amendment." },
    { q: "\"Procedure established by law\" in the Indian Constitution is taken from", tag: "Asked in SSC CGL", opts: ["USA", "Japan", "Britain", "Germany"], a: 1, why: "It comes from Japan. The USA follows \"due process of law\", a different idea." },
    { q: "Which Amendment Act removed the Right to Property from the Fundamental Rights?", tag: "Practice", opts: ["42nd Amendment, 1976", "44th Amendment, 1978", "61st Amendment, 1988", "86th Amendment, 2002"], a: 1, why: "The 44th Amendment Act, 1978 removed it from Part III. It is now a legal right under Article 300A." }
  ]
};
