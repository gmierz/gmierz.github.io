const API_URL = 'https://sql.telemetry.mozilla.org/api/queries/108351/results.json?api_key=cu3eqD40BhCbwPJ8KfQ7NHCueftTpnIvJcdRVo7a';

// Hard-coded CDF data for testing (matches the format returned by the alerts API)
const HARDCODED_CDF_DATA = {
    before: {
        bin: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 20, 22, 24, 26, 29, 32, 34, 38, 41, 45, 49, 53, 58, 64, 69, 76, 82, 90, 98, 107, 117, 128, 139, 152, 165, 181, 197, 215, 234, 256, 279, 304, 331, 362, 394, 430, 469, 512, 558, 608, 663, 724, 789, 861, 939, 1024, 1116, 1217, 1327, 1448, 1579, 1722, 1878, 2048, 2233, 2435, 2655, 2896, 3158, 3444, 3756, 4096, 4466, 4870, 5311, 5792, 6316, 6888, 7512, 8192, 8933, 9741, 10623, 11585, 12633, 13777, 15024, 16384, 17866, 19483, 21247, 23170, 25267, 27554, 30048, 32768, 35733, 38967, 42494, 46340, 50535, 55108, 60096, 65536, 71467, 77935, 84989, 92681, 101070, 110217, 120193, 131072, 142935, 155871, 169979, 185363, 202140, 220435, 240387, 262144, 285870, 311743, 339958, 370727, 404281, 440871, 480774, 524288, 571740, 623487, 679917, 741455, 808562, 881743, 961548, 1048576, 1143480, 1246974, 1359834, 1482910, 1617125, 1763487, 1923096, 2097152, 2286960, 2493948, 2719669, 2965820, 3234250, 3526975, 3846193, 4194304, 4573920, 4987896, 5439339, 5931641, 6468501, 7053950, 7692387, 8388608, 9147841, 9975792, 10878678, 11863283, 12937002, 14107900, 15384774, 16777216, 18295683, 19951584, 21757357, 23726566, 25874004, 28215801, 30769549, 33554432, 36591367, 39903169, 43514714, 47453132, 51748008, 56431603, 61539099, 67108864, 73182735, 79806338, 87029429, 94906265, 103496016, 112863206, 123078199, 134217728, 146365470, 159612677, 174058858, 189812531, 206992033, 225726412, 246156398, 268435456, 292730940, 319225354, 348117717, 379625062, 413984066, 451452825, 492312796, 536870912, 585461880, 638450708, 696235434, 759250124, 827968132, 902905650, 984625593, 1073741824, 1170923761, 1276901416, 1392470868, 1518500249, 1655936264, 1805811301, 1969251187, 2147483648, 2341847523, 2553802833, 2784941737, 3037000499, 3311872529, 3611622602, 3938502375, 4294967296, 4683695047, 5107605667, 5569883475, 6074000999, 6623745058, 7223245205, 7877004751, 8589934592, 9367390095, 10215211334, 11139766950, 12148001999, 13247490117, 14446490411, 15754009503, 17179869184, 18734780191, 20430422668, 22279533901, 24296003999, 26494980234, 28892980822, 31508019006, 34359738368, 37469560382, 40860845336, 44559067803, 48592007999, 52989960469, 57785961645, 63016038013, 68719476736, 74939120765, 81721690673, 89118135606, 97184015999, 105979920938, 115571923290, 126032076027, 137438953472, 149878241530, 163443381347, 178236271212, 194368031998, 211959841877, 231143846581, 252064152055, 274877906944, 299756483061, 326886762694, 356472542424, 388736063996, 423919683754, 462287693163, 504128304110, 549755813888, 599512966122, 653773525389, 712945084849, 777472127993, 847839367509, 924575386326, 1008256608221, 1099511627776, 1199025932245, 1307547050779, 1425890169698, 1554944255987, 1695678735018, 1849150772653, 2016513216442, 2199023255552, 2398051864490, 2615094101558, 2851780339397, 3109888511975, 3391357470036, 3698301545306, 4033026432884, 4398046511104, 4796103728980, 5230188203117, 5703560678794, 6219777023950, 6782714940072, 7396603090612, 8066052865769, 8796093022208, 9592207457960, 10460376406235, 11407121357589, 12439554047901, 13565429880144, 14793206181225, 16132105731538, 17592186044416, 19184414915921, 20920752812471, 22814242715178, 24879108095803, 27130859760288, 29586412362451, 32264211463076, 35184372088832, 38368829831842],
        cdf: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 3.0083269400714047e-05, 4.342336171415286e-05, 6.20722662747765e-05, 9.147491872072326e-05, 0.0001388458587725264, 0.00020200711217493054, 0.0002676185866144969, 0.000369166636265776, 0.0004688089584437067, 0.0005613728642920576, 0.0007158729130242316, 0.0009157020509439069, 0.0011943466322256338, 0.0014660489205687345, 0.001734484247528952, 0.002093441629473219, 0.002551632963422556, 0.0031919573944676188, 0.004174904400542533, 0.005550022895954358, 0.00747780235863722, 0.010117915526179523, 0.013639155403363554, 0.0182220216065936, 0.02388666039773077, 0.03102674062341246, 0.04047247884506381, 0.05108438615701343, 0.06259538846621064, 0.0755870048988086, 0.09040498886782909, 0.10672849754079482, 0.1251830178991369, 0.14608871215837793, 0.16946654332072467, 0.1957395828852605, 0.2251818472379747, 0.2583781224664034, 0.29410003109058247, 0.33131112961179243, 0.36962128839156055, 0.4087072143763725, 0.4477812976261714, 0.4871088426299257, 0.5247665619968539, 0.5611546584963593, 0.5946690540894461, 0.6251890073283389, 0.6543403759945856, 0.6815141440370605, 0.7063765369011455, 0.7296612596640801, 0.7504304221621948, 0.7693986721979953, 0.7879464370791405, 0.8050738904990774, 0.8216818970591359, 0.8381281890307416, 0.8519283784056031, 0.8655235659536886, 0.8785289308487729, 0.8905962694567969, 0.9023878220747492, 0.9126847398600325, 0.9218653097161065, 0.9310396178961966, 0.9388381269639202, 0.9454816290594037, 0.9512505383680112, 0.9568279220655472, 0.9615128808119924, 0.9655360076316218, 0.9693937445312427, 0.9730847302769458, 0.9762464682786217, 0.9789434810235825, 0.9814420258645332, 0.9835304309285412, 0.9852282979839037, 0.9867203464721446, 0.9881406579333529, 0.9894723530670506, 0.990608847258121, 0.9917324097270508, 0.9925969293829963, 0.9933680683927476, 0.9939949166080883, 0.9945470330817955, 0.9950430667184299, 0.9956079787908867, 0.9960910807053805, 0.9964300279488546, 0.9967378029358004, 0.9970996189089547, 0.9973717295674707, 0.9976027309619186, 0.9978345490967124, 0.998049351807637, 0.9982547620045857, 0.9984396175695005, 0.9986040546257723, 0.9987710780264721, 0.998909107144899, 0.9990470001399349, 0.9991686944514472, 0.9992643891952875, 0.9994010570798048, 0.9994849090886321, 0.9995501121928988, 0.999611231595437, 0.999666769938946, 0.9997352400045956, 0.9997841083019479, 0.9998211338642872, 0.9998932792614925, 0.9999226819139384, 0.999944597779882, 0.9999662413990436, 0.9999791731211841, 0.9999953718047075, 0.9999965969152261, 0.9999976859023538, 0.9999982303959176, 0.9999986387660905, 0.9999997277532181, 0.9999997277532181, 0.999999863876609, 0.999999863876609, 0.999999863876609, 0.999999863876609, 0.999999863876609, 0.999999863876609, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    },
    after: {
        bin: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 20, 22, 24, 26, 29, 32, 34, 38, 41, 45, 49, 53, 58, 64, 69, 76, 82, 90, 98, 107, 117, 128, 139, 152, 165, 181, 197, 215, 234, 256, 279, 304, 331, 362, 394, 430, 469, 512, 558, 608, 663, 724, 789, 861, 939, 1024, 1116, 1217, 1327, 1448, 1579, 1722, 1878, 2048, 2233, 2435, 2655, 2896, 3158, 3444, 3756, 4096, 4466, 4870, 5311, 5792, 6316, 6888, 7512, 8192, 8933, 9741, 10623, 11585, 12633, 13777, 15024, 16384, 17866, 19483, 21247, 23170, 25267, 27554, 30048, 32768, 35733, 38967, 42494, 46340, 50535, 55108, 60096, 65536, 71467, 77935, 84989, 92681, 101070, 110217, 120193, 131072, 142935, 155871, 169979, 185363, 202140, 220435, 240387, 262144, 285870, 311743, 339958, 370727, 404281, 440871, 480774, 524288, 571740, 623487, 679917, 741455, 808562, 881743, 961548, 1048576, 1143480, 1246974, 1359834, 1482910, 1617125, 1763487, 1923096, 2097152, 2286960, 2493948, 2719669, 2965820, 3234250, 3526975, 3846193, 4194304, 4573920, 4987896, 5439339, 5931641, 6468501, 7053950, 7692387, 8388608, 9147841, 9975792, 10878678, 11863283, 12937002, 14107900, 15384774, 16777216, 18295683, 19951584, 21757357, 23726566, 25874004, 28215801, 30769549, 33554432, 36591367, 39903169, 43514714, 47453132, 51748008, 56431603, 61539099, 67108864, 73182735, 79806338, 87029429, 94906265, 103496016, 112863206, 123078199, 134217728, 146365470, 159612677, 174058858, 189812531, 206992033, 225726412, 246156398, 268435456, 292730940, 319225354, 348117717, 379625062, 413984066, 451452825, 492312796, 536870912, 585461880, 638450708, 696235434, 759250124, 827968132, 902905650, 984625593, 1073741824, 1170923761, 1276901416, 1392470868, 1518500249, 1655936264, 1805811301, 1969251187, 2147483648, 2341847523, 2553802833, 2784941737, 3037000499, 3311872529, 3611622602, 3938502375, 4294967296, 4683695047, 5107605667, 5569883475, 6074000999, 6623745058, 7223245205, 7877004751, 8589934592, 9367390095, 10215211334, 11139766950, 12148001999, 13247490117, 14446490411, 15754009503, 17179869184, 18734780191, 20430422668, 22279533901, 24296003999, 26494980234, 28892980822, 31508019006, 34359738368, 37469560382, 40860845336, 44559067803, 48592007999, 52989960469, 57785961645, 63016038013, 68719476736, 74939120765, 81721690673, 89118135606, 97184015999, 105979920938, 115571923290, 126032076027, 137438953472, 149878241530, 163443381347, 178236271212, 194368031998, 211959841877, 231143846581, 252064152055, 274877906944, 299756483061, 326886762694, 356472542424, 388736063996, 423919683754, 462287693163, 504128304110, 549755813888, 599512966122, 653773525389, 712945084849, 777472127993, 847839367509, 924575386326, 1008256608221, 1099511627776, 1199025932245, 1307547050779, 1425890169698, 1554944255987, 1695678735018, 1849150772653, 2016513216442, 2199023255552, 2398051864490, 2615094101558, 2851780339397, 3109888511975, 3391357470036, 3698301545306, 4033026432884, 4398046511104, 4796103728980, 5230188203117, 5703560678794, 6219777023950, 6782714940072, 7396603090612, 8066052865769, 8796093022208, 9592207457960, 10460376406235, 11407121357589, 12439554047901, 13565429880144, 14793206181225, 16132105731538, 17592186044416, 19184414915921, 20920752812471, 22814242715178, 24879108095803, 27130859760288, 29586412362451, 32264211463076, 35184372088832, 38368829831842],
        cdf: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.257204165842898e-05, 4.08952284164478e-05, 6.891111541602729e-05, 0.00010369861491313547, 0.00015295877641476578, 0.00021270829845178367, 0.00028945324009044216, 0.0004372337245953331, 0.0005684171196454968, 0.0006656096754923792, 0.0007928097690734084, 0.0009537351484264433, 0.0011405519873288524, 0.0013892427757184846, 0.0017006041738891668, 0.0021395639957877913, 0.002676911363974039, 0.003385673472048709, 0.004469928131947127, 0.005976943854436355, 0.008050252269120876, 0.010723445885057057, 0.014243754946762511, 0.018819904451219893, 0.02446942092489339, 0.031497690813749986, 0.04025431521006405, 0.050700523312869346, 0.06230879323093681, 0.07521150334975737, 0.089839779665007, 0.10633011664036139, 0.12483547305223529, 0.145480393459897, 0.1686908255671126, 0.19429176966267145, 0.2228811192970907, 0.25467158276882207, 0.28961389991636394, 0.32605446952316297, 0.3630674395510766, 0.40054950971533865, 0.4382582297331945, 0.4753932215627793, 0.5124363319051427, 0.549190254560847, 0.582653306319468, 0.6123994067005238, 0.6405458132115753, 0.6668496772397208, 0.6906062199783547, 0.7132794374940997, 0.7333398747995238, 0.7513657744912295, 0.7688427752404885, 0.7854188859741449, 0.8021346778126524, 0.8216917585890934, 0.8358554491763263, 0.8488099422142455, 0.8607599793983648, 0.8730840485904358, 0.8875563122648109, 0.8996360723001083, 0.9090487464483888, 0.9193149093247892, 0.9285220451172624, 0.9368841898914165, 0.9431768767756397, 0.9488506913882748, 0.9539278074408337, 0.9580306079540423, 0.9617973505999715, 0.9653582893366621, 0.9687241790780808, 0.9715816667753223, 0.9741412035226725, 0.9764212452836051, 0.9784597661987925, 0.9802549073942158, 0.982214293386883, 0.9840134178837755, 0.9853692009271533, 0.9868240354003969, 0.9880945757923351, 0.9894061441894054, 0.9905857325311318, 0.9916642777922579, 0.992378749299105, 0.9931602730473491, 0.9937942818645197, 0.9943406580493693, 0.9950070643851555, 0.9956575375150651, 0.9961381892256741, 0.9965402371206253, 0.9968753655508953, 0.9971593749456445, 0.9974243972700576, 0.997786479373602, 0.9981119151036303, 0.9983624647660388, 0.998574641957628, 0.998788014139658, 0.9989356618474473, 0.9990603391834312, 0.9992231234368031, 0.9993759494365022, 0.9994866852173442, 0.9995602435178076, 0.9996395112170433, 0.9997129367407911, 0.9997637902228803, 0.9997997727128182, 0.9998717376926939, 0.9999114379306696, 0.9999349394093374, 0.9999579097811429, 0.9999776935117728, 0.9999946889313744, 0.9999960166985309, 0.9999974772424028, 0.9999980083492654, 0.9999980083492654, 0.9999988050095593, 0.9999994688931374, 0.9999998672232844, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    }
};

let allAlerts = [];
let currentView = 'with-bugs'; // 'with-bugs', 'without-bugs', or 'grouped'
let currentSort = {
    column: null,
    direction: 'asc' // 'asc' or 'desc'
};
let currentFilters = {
    platforms: new Set(),
    probeSearchTerms: [],
    groupedWithBugsOnly: false,
    dateFrom: null,
    dateTo: null,
    alertSummaryId: null
};
let maxProbeLength = 0;
let groupedSortColumn = 'summaryId'; // 'summaryId', 'count', 'mostRecent', or 'detectionDate'
let groupedSortDirection = 'desc'; // 'asc' or 'desc' for grouped view

window.mobileCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

async function fetchAlerts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.query_result.data;
    } catch (error) {
        console.error('Error fetching alerts:', error);
        throw error;
    }
}

function parseData(data) {
    const rows = data.rows;

    // The rows are already objects with column names as keys
    const alerts = rows.map(row => ({
        alertId: row['Alert ID'],
        alertSummaryId: row['Alert Summary ID'],
        bug: row['Bug'],
        bugStatus: row['Bug Status'],
        created: row['created'],
        probe: row['probe'],
        platform: row['platform'],
        pushDate: row['Push Date'],
        detectionPush: row['Detection Push'],
        pushRange: row['Push Range'],
        newestPush: row['Newest Push'],
        oldestPush: row['Oldest Push'],
        additionalData: row['Extra Data'],
    }));

    return alerts;
}

function getUniqueValues(field, alertsList = allAlerts) {
    const values = new Set();
    alertsList.forEach(alert => {
        if (alert[field]) {
            values.add(alert[field]);
        }
    });
    return Array.from(values).sort();
}

function calculateMaxProbeLength() {
    maxProbeLength = 0;
    allAlerts.forEach(alert => {
        if (alert.probe && alert.probe.length > maxProbeLength) {
            maxProbeLength = alert.probe.length;
        }
    });
}

function padProbe(probeName) {
    if (!probeName) return 'N/A';
    const padding = maxProbeLength - probeName.length;
    return probeName + ' '.repeat(padding);
}

function getViewFilteredAlerts() {
    if (currentView === 'with-bugs') {
        return allAlerts.filter(alert => alert.bug !== null && alert.bug !== undefined);
    } else if (currentView === 'without-bugs') {
        return allAlerts.filter(alert => alert.bug === null || alert.bug === undefined);
    } else {
        // grouped view - return all alerts
        return allAlerts;
    }
}

function getFilteredAlerts() {
    let filtered;
    if (currentView === 'with-bugs') {
        filtered = allAlerts.filter(alert => alert.bug !== null && alert.bug !== undefined);
    } else if (currentView === 'without-bugs') {
        filtered = allAlerts.filter(alert => alert.bug === null || alert.bug === undefined);
    } else {
        // grouped view - return all alerts
        filtered = [...allAlerts];
    }

    // Apply platform filter
    if (currentFilters.platforms.size > 0) {
        filtered = filtered.filter(alert => currentFilters.platforms.has(alert.platform));
    }

    // Apply probe filter (text search with space-separated terms)
    if (currentFilters.probeSearchTerms.length > 0) {
        filtered = filtered.filter(alert => {
            if (!alert.probe) return false;
            const probeLower = alert.probe.toLowerCase();
            // Match if probe contains ANY of the search terms
            return currentFilters.probeSearchTerms.some(term =>
                probeLower.includes(term.toLowerCase())
            );
        });
    }

    // Apply date range filter
    if (currentFilters.dateFrom || currentFilters.dateTo) {
        filtered = filtered.filter(alert => {
            if (!alert.pushDate) return false;
            const pushDate = new Date(alert.pushDate);
            // Get date without time for comparison
            const pushDateOnly = new Date(pushDate.getFullYear(), pushDate.getMonth(), pushDate.getDate());

            if (currentFilters.dateFrom) {
                const fromDate = new Date(currentFilters.dateFrom);
                if (pushDateOnly < fromDate) return false;
            }

            if (currentFilters.dateTo) {
                const toDate = new Date(currentFilters.dateTo);
                if (pushDateOnly > toDate) return false;
            }

            return true;
        });
    }

    // Apply alert summary ID filter
    if (currentFilters.alertSummaryId !== null) {
        filtered = filtered.filter(alert => {
            return alert.alertSummaryId === currentFilters.alertSummaryId;
        });
    }

    // Apply sorting if a column is selected (not for grouped view)
    if (currentSort.column && currentView !== 'grouped') {
        filtered = sortAlerts(filtered, currentSort.column, currentSort.direction);
    }

    return filtered;
}

function sortAlerts(alerts, column, direction) {
    const sorted = [...alerts].sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle null/undefined values
        if (aVal === null || aVal === undefined) return direction === 'asc' ? 1 : -1;
        if (bVal === null || bVal === undefined) return direction === 'asc' ? -1 : 1;

        // Handle dates
        if (column === 'pushDate' || column === 'created') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }

        // Handle numbers
        if (column === 'alertId' || column === 'alertSummaryId' || column === 'bug') {
            aVal = Number(aVal);
            bVal = Number(bVal);
        }

        // Handle strings
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return sorted;
}

function sortByColumn(column) {
    // Toggle direction if clicking the same column
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    updateSortIndicators();
    updateView();
}

function sortGroupedBy(column) {
    if (groupedSortColumn === column) {
        groupedSortDirection = groupedSortDirection === 'desc' ? 'asc' : 'desc';
    } else {
        groupedSortColumn = column;
        groupedSortDirection = column === 'summaryId' ? 'desc' : 'desc'; // Default desc for both
    }
    updateGroupedSortIndicators();
    updateView();
}

function updateGroupedSortIndicators() {
    // Remove all sort indicators
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    // Add indicator to current sorted column
    const columnMap = {
        'summaryId': 1,
        'count': 2,
        'mostRecent': 3,
        'detectionDate': 4
    };
    const columnIndex = columnMap[groupedSortColumn];
    const th = document.querySelectorAll('th')[columnIndex];
    if (th) {
        th.classList.add(`sorted-${groupedSortDirection}`);
    }
}

function updateSortIndicators() {
    // Remove all sort indicators
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    // Add indicator to current sorted column
    if (currentSort.column) {
        let columnMap;

        if (currentView === 'with-bugs') {
            columnMap = {
                'alertId': 0,
                'bug': 1,
                'bugStatus': 2,
                'probe': 3,
                'platform': 4,
                'pushDate': 5
            };
        } else {
            // Without bugs view has different column order
            columnMap = {
                'alertId': 0,
                'probe': 1,
                'platform': 2,
                'pushDate': 3
            };
        }

        const thIndex = columnMap[currentSort.column];
        if (thIndex !== undefined) {
            const th = document.querySelectorAll('th')[thIndex + 1]; // +1 for expand column
            if (th) {
                th.classList.add(`sorted-${currentSort.direction}`);
            }
        }
    }
}

function getBugStatusClass(status) {
    if (!status) return 'na';
    const statusLower = status.toLowerCase();
    if (statusLower === 'new') return 'new';
    if (statusLower === 'fixed') return 'fixed';
    if (statusLower === 'invalid') return 'invalid';
    if (statusLower === 'inactive') return 'inactive';
    if (statusLower === 'duplicate') return 'duplicate';
    return 'na';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function createDetailsRow(alert, rowId) {
    const treeherderBase = 'https://treeherder.mozilla.org/jobs?repo=mozilla-central&revision=';

    const detectionPushLink = alert.detectionPush
        ? `<a href="${treeherderBase}${alert.detectionPush}" target="_blank">${alert.detectionPush}</a>`
        : 'N/A';

    const oldestPushLink = alert.oldestPush
        ? `<a href="${treeherderBase}${alert.oldestPush}" target="_blank">${alert.oldestPush}</a>`
        : 'N/A';

    const newestPushLink = alert.newestPush
        ? `<a href="${treeherderBase}${alert.newestPush}" target="_blank">${alert.newestPush}</a>`
        : 'N/A';

    // Make alert summary ID a clickable link if not already filtered
    const alertSummaryIdContent = currentFilters.alertSummaryId === null
        ? `<a href="#" class="bug-link" onclick="event.stopPropagation(); applyAlertSummaryFilter(${alert.alertSummaryId}); return false;">${alert.alertSummaryId}</a>`
        : alert.alertSummaryId;

    return `
        <tr class="details-row" id="details-${rowId}">
            <td colspan="7" class="details-cell">
                <div class="details-content">
                    <div class="detail-item" style="grid-row: 1;">
                        <div class="detail-label">Alert Summary ID</div>
                        <div class="detail-value">${alertSummaryIdContent}</div>
                    </div>
                    <div class="detail-item" style="grid-row: 1;">
                        <div class="detail-label">Created</div>
                        <div class="detail-value">${formatDate(alert.created)}</div>
                    </div>
                    <div class="detail-item" style="grid-row: 2;">
                        <div class="detail-label">Detection Push</div>
                        <div class="detail-value">${detectionPushLink}</div>
                    </div>
                    <div class="detail-item" style="grid-row: 2;">
                        <div class="detail-label">Oldest Push</div>
                        <div class="detail-value">${oldestPushLink}</div>
                    </div>
                    <div class="detail-item" style="grid-row: 2;">
                        <div class="detail-label">Newest Push</div>
                        <div class="detail-value">${newestPushLink}</div>
                    </div>
                    <div class="detail-item" style="grid-column: 1 / -1; grid-row: 3;">
                        <div class="detail-label">Push Range</div>
                        <div class="detail-value">
                            ${alert.pushRange ? `<a href="${alert.pushRange}" target="_blank">View on Treeherder</a>` : 'N/A'}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 16px; padding: 0 12px 12px;">
                    <div class="cdf-chart-item" style="flex: 1; min-width: 0;">
                        <div class="detail-label">Distribution (CDF)</div>
                        <div class="detail-value cdf-chart-wrapper" style="max-width: none;">
                            <canvas id="chart-${rowId}" data-probe="${alert.probe || ''}" height="200"></canvas>
                        </div>
                    </div>
                    <div class="cdf-chart-item" style="flex: 1; min-width: 0;">
                        <div class="detail-label">CDF Difference (After − Before)</div>
                        <div class="detail-value cdf-chart-wrapper" style="max-width: none;">
                            <canvas id="diff-chart-${rowId}" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

function toggleRow(rowId) {
    const detailsRow = document.getElementById(`details-${rowId}`);
    const expandBtn = document.getElementById(`expand-${rowId}`);

    if (detailsRow.classList.contains('visible')) {
        detailsRow.classList.remove('visible');
        expandBtn.classList.remove('expanded');
    } else {
        detailsRow.classList.add('visible');
        expandBtn.classList.add('expanded');
        renderCDFChart(`chart-${rowId}`);
    }
}

function formatBinValue(val, unit) {
    const label = unit ? ` ${unit}` : '';
    if (val >= 1e12) return (val / 1e12).toPrecision(3) + 'T' + label;
    if (val >= 1e9) return (val / 1e9).toPrecision(3) + 'G' + label;
    if (val >= 1e6) return (val / 1e6).toPrecision(3) + 'M' + label;
    if (val >= 1e3) return (val / 1e3).toPrecision(3) + 'K' + label;
    return val.toPrecision(3) + label;
}

function normalizeTimeUnit(unit) {
    const mapping = {
        nanosecond: 'ns',
        microsecond: 'us',
        millisecond: 'ms',
        second: 's'
    };
    const normalized = unit ? unit.toLowerCase() : '';
    return mapping[normalized] || normalized;
}

function convertFromNanoseconds(valueNs, unit) {
    const factors = { ns: 1, us: 1_000, ms: 1_000_000, s: 1_000_000_000 };
    return valueNs / (factors[unit] || 1);
}

function setupChartBehavior(canvas, isTouchDevice) {
    canvas.style.touchAction = 'none';
    canvas.addEventListener('dblclick', (e) => e.preventDefault());

    const originalLimits = {
        xMin: canvas._chartInstance.scales.x.options.min,
        xMax: canvas._chartInstance.scales.x.options.max,
        yMin: canvas._chartInstance.scales.y.options.min,
        yMax: canvas._chartInstance.scales.y.options.max
    };

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const chart = canvas._chartInstance;
        if (!chart || chart === 'pending') return;

        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        const rect = canvas.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;

        const logMin = Math.log10(xScale.min);
        const logMax = Math.log10(xScale.max);
        const logCursor = Math.log10(Math.max(xScale.getValueForPixel(cursorX), 1e-10));
        const logRange = logMax - logMin;
        const newLogRange = logRange / factor;
        const xFrac = logRange > 0 ? (logCursor - logMin) / logRange : 0.5;
        xScale.options.min = Math.pow(10, logCursor - xFrac * newLogRange);
        xScale.options.max = Math.pow(10, logCursor + (1 - xFrac) * newLogRange);

        const yValue = yScale.getValueForPixel(cursorY);
        const yRange = yScale.max - yScale.min;
        const newYRange = yRange / factor;
        const yFrac = yRange > 0 ? (yValue - yScale.min) / yRange : 0.5;
        yScale.options.min = yValue - yFrac * newYRange;
        yScale.options.max = yValue + (1 - yFrac) * newYRange;

        chart.update('none');
    }, { passive: false });

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Zoom';
    resetBtn.className = 'reset-zoom-btn';
    resetBtn.onclick = () => {
        const chart = canvas._chartInstance;
        if (!chart || chart === 'pending') return;
        chart.scales.x.options.min = originalLimits.xMin;
        chart.scales.x.options.max = originalLimits.xMax;
        chart.scales.y.options.min = originalLimits.yMin;
        chart.scales.y.options.max = originalLimits.yMax;
        chart.update('default');
    };
    canvas.parentElement.appendChild(resetBtn);

    const defaultHint = isTouchDevice
        ? 'Drag to zoom · Pinch to zoom'
        : 'Drag to zoom · Scroll to zoom · Double-click and hold to pan';
    const hint = document.createElement('div');
    hint.className = 'chart-hint';
    hint.textContent = defaultHint;
    canvas.parentElement.appendChild(hint);

    if (!isTouchDevice) {
        let lastDownTime = 0;
        let isPanning = false;
        let panStartX = 0;
        let panStartY = 0;

        // Capture phase runs before the zoom plugin's mousedown listener.
        // Two presses within 300 ms with the second held → pan while held.
        // preventDefault() suppresses the synthesized mousedown the plugin listens to.
        canvas.addEventListener('mousedown', (e) => {
            const now = Date.now();
            if (now - lastDownTime < 300) {
                isPanning = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                canvas._chartInstance.options.plugins.zoom.zoom.drag.enabled = false;
                canvas._chartInstance.update('none');
                canvas.style.cursor = 'grabbing';
                hint.textContent = 'Panning… release to stop';
                e.preventDefault();
                e.stopPropagation();
            }
            lastDownTime = now;
        }, true);

        document.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            const dx = e.clientX - panStartX;
            const dy = e.clientY - panStartY;
            canvas._chartInstance.pan({ x: dx, y: dy }, undefined, 'none');
            panStartX = e.clientX;
            panStartY = e.clientY;
        });

        document.addEventListener('mouseup', () => {
            if (!isPanning) return;
            isPanning = false;
            canvas._chartInstance.options.plugins.zoom.zoom.drag.enabled = true;
            canvas._chartInstance.update('none');
            canvas.style.cursor = 'default';
            hint.textContent = defaultHint;
        });
    }
}

async function renderCDFChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || canvas._chartInstance) return;

    // Guard against duplicate calls while the fetch is in-flight
    canvas._chartInstance = 'pending';

    const probe = canvas.dataset.probe;
    let timeUnit = 'ns';

    if (probe) {
        try {
            const url = `https://dictionary.telemetry.mozilla.org/data/firefox_desktop/metrics/data_${probe}.json`;
            const response = await fetch(url);
            if (response.ok) {
                const metadata = await response.json();
                if (metadata.time_unit) {
                    timeUnit = normalizeTimeUnit(metadata.time_unit);
                }
            }
        } catch (e) {
            console.warn('Could not fetch probe metadata for', probe, e);
        }
    }

    // Row may have been collapsed while fetching — bail out cleanly
    const currentCanvas = document.getElementById(canvasId);
    if (!currentCanvas) return;

    const bins = HARDCODED_CDF_DATA.before.bin;
    const beforeCdf = HARDCODED_CDF_DATA.before.cdf;
    const afterCdf = HARDCODED_CDF_DATA.after.cdf;

    // Find meaningful range: first non-zero to last non-one (with padding)
    let startIdx = 0;
    let endIdx = bins.length - 1;

    for (let i = 0; i < bins.length; i++) {
        if (beforeCdf[i] > 0 || afterCdf[i] > 0) {
            startIdx = Math.max(0, i - 1);
            break;
        }
    }
    for (let i = bins.length - 1; i >= 0; i--) {
        if (beforeCdf[i] < 1 || afterCdf[i] < 1) {
            endIdx = Math.min(bins.length - 1, i + 1);
            break;
        }
    }

    // Build point arrays: convert bins from nanoseconds, skip bin=0 (invalid on log scale)
    const beforePoints = [];
    const afterPoints = [];
    for (let i = startIdx; i <= endIdx; i++) {
        const rawBin = bins[i] > 0 ? bins[i] : 1;
        const x = convertFromNanoseconds(rawBin, timeUnit);
        beforePoints.push({ x, y: beforeCdf[i] });
        afterPoints.push({ x, y: afterCdf[i] });
    }

    const isTouchDevice = window.mobileCheck();

    currentCanvas._chartInstance = new Chart(currentCanvas, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Before',
                    data: beforePoints,
                    borderColor: '#4a7eff',
                    backgroundColor: 'rgba(74, 126, 255, 0.08)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                },
                {
                    label: 'After',
                    data: afterPoints,
                    borderColor: '#ff6b4a',
                    backgroundColor: 'rgba(255, 107, 74, 0.08)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            animation: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        title: (items) => formatBinValue(items[0].parsed.x, timeUnit),
                        label: (item) => `${item.dataset.label}: ${(item.parsed.y * 100).toFixed(2)}%`
                    }
                },
                zoom: {
                    zoom: {
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(74, 126, 255, 0.15)',
                            borderColor: 'rgba(74, 126, 255, 0.8)',
                            borderWidth: 1,
                            threshold: 10
                        },
                        wheel: { enabled: false },
                        pinch: { enabled: true },
                        mode: 'xy'
                    },
                    pan: {
                        enabled: isTouchDevice,
                        mode: 'xy'
                    }
                }
            },
            scales: {
                x: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: `Value (${timeUnit})`
                    },
                    ticks: {
                        maxTicksLimit: 12,
                        callback: (val) => formatBinValue(val, timeUnit)
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Cumulative Probability'
                    },
                    ticks: {
                        callback: (val) => `${(val * 100).toFixed(0)}%`
                    }
                }
            }
        }
    });

    setupChartBehavior(currentCanvas, isTouchDevice);

    // Build diff points: after CDF minus before CDF at each bin
    const diffPoints = beforePoints.map((pt, i) => ({ x: pt.x, y: afterPoints[i].y - pt.y }));

    const diffCanvas = document.getElementById('diff-' + canvasId);
    if (diffCanvas) {
        diffCanvas._chartInstance = new Chart(diffCanvas, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'After − Before',
                    data: diffPoints,
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.08)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                }]
            },
            options: {
                responsive: true,
                animation: false,
                plugins: {
                    title: { display: false },
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            title: (items) => formatBinValue(items[0].parsed.x, timeUnit),
                            label: (item) => `${item.dataset.label}: ${(item.parsed.y * 100).toFixed(2)}%`
                        }
                    },
                    zoom: {
                        zoom: {
                            drag: {
                                enabled: true,
                                backgroundColor: 'rgba(74, 126, 255, 0.15)',
                                borderColor: 'rgba(74, 126, 255, 0.8)',
                                borderWidth: 1,
                                threshold: 10
                            },
                            wheel: { enabled: false },
                            pinch: { enabled: true },
                            mode: 'xy'
                        },
                        pan: {
                            enabled: isTouchDevice,
                            mode: 'xy'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: `Value (${timeUnit})`
                        },
                        ticks: {
                            maxTicksLimit: 12,
                            callback: (val) => formatBinValue(val, timeUnit)
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Difference (After − Before)'
                        },
                        ticks: {
                            callback: (val) => `${(val * 100).toFixed(1)}%`
                        }
                    }
                }
            }
        });

        setupChartBehavior(diffCanvas, isTouchDevice);
    }
}

function getRowHTMLWithBug(alert, rowId, bugStatusClass) {
    const probeContent = alert.probe
        ? `<a href="https://glam.telemetry.mozilla.org/fog/probe/${encodeURIComponent(alert.probe)}/explore?os=${encodeURIComponent(alert.platform)}"
              target="_blank"
              class="bug-link"
              onclick="event.stopPropagation()">${alert.probe}</a>${' '.repeat(maxProbeLength - alert.probe.length)}`
        : padProbe(null);

    return `
        <td>
            <button class="expand-btn" id="expand-${rowId}">▶</button>
        </td>
        <td>${alert.alertId}</td>
        <td>
            <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=${alert.bug}"
               target="_blank"
               class="bug-link"
               onclick="event.stopPropagation()">
                ${alert.bug}
            </a>
        </td>
        <td><span class="badge ${bugStatusClass}">${alert.bugStatus}</span></td>
        <td class="probe-cell">${probeContent}</td>
        <td>${alert.platform}</td>
        <td>${formatDate(alert.pushDate)}</td>
    `;
}

function getRowHTMLWithoutBug(alert, rowId) {
    const probeContent = alert.probe
        ? `<a href="https://glam.telemetry.mozilla.org/fog/probe/${encodeURIComponent(alert.probe)}/explore?os=${encodeURIComponent(alert.platform)}"
              target="_blank"
              class="bug-link"
              onclick="event.stopPropagation()">${alert.probe}</a>${' '.repeat(maxProbeLength - alert.probe.length)}`
        : padProbe(null);

    return `
        <td>
            <button class="expand-btn" id="expand-${rowId}">▶</button>
        </td>
        <td>${alert.alertId}</td>
        <td class="probe-cell">${probeContent}</td>
        <td>${alert.platform}</td>
        <td>${formatDate(alert.pushDate)}</td>
    `;
}

function groupAlertsBySummaryId(alerts) {
    const grouped = {};
    alerts.forEach(alert => {
        const summaryId = alert.alertSummaryId;
        if (!grouped[summaryId]) {
            grouped[summaryId] = [];
        }
        grouped[summaryId].push(alert);
    });
    return grouped;
}

function renderGroupedAlerts(alerts) {
    const tbody = document.getElementById('alerts-body');
    tbody.innerHTML = '';

    let grouped = groupAlertsBySummaryId(alerts);

    // Filter groups if "With Bugs Only" is active
    if (currentFilters.groupedWithBugsOnly) {
        const filteredGrouped = {};
        Object.keys(grouped).forEach(summaryId => {
            const groupAlerts = grouped[summaryId];
            // Check if at least one alert in the group has a bug
            if (groupAlerts.some(alert => alert.bug !== null && alert.bug !== undefined)) {
                filteredGrouped[summaryId] = groupAlerts;
            }
        });
        grouped = filteredGrouped;
    }

    // Create array of [summaryId, count, mostRecentCreated, detectionDate] for sorting
    const summaryData = Object.keys(grouped).map(id => {
        const groupAlerts = grouped[id];

        // Find most recent created date
        const mostRecentCreated = groupAlerts.reduce((latest, alert) => {
            const alertDate = new Date(alert.created);
            return alertDate > latest ? alertDate : latest;
        }, new Date(0));

        // Get detection date (should be same for all alerts in group, so just take first)
        const detectionDate = groupAlerts[0].pushDate;

        return {
            id: id,
            count: groupAlerts.length,
            mostRecentCreated: mostRecentCreated,
            detectionDate: detectionDate
        };
    });

    // Sort based on current sort column and direction
    summaryData.sort((a, b) => {
        let aVal, bVal;
        if (groupedSortColumn === 'summaryId') {
            aVal = Number(a.id);
            bVal = Number(b.id);
        } else if (groupedSortColumn === 'count') {
            aVal = a.count;
            bVal = b.count;
        } else if (groupedSortColumn === 'mostRecent') {
            aVal = a.mostRecentCreated.getTime();
            bVal = b.mostRecentCreated.getTime();
        } else if (groupedSortColumn === 'detectionDate') {
            aVal = new Date(a.detectionDate).getTime();
            bVal = new Date(b.detectionDate).getTime();
        }

        if (groupedSortDirection === 'desc') {
            return bVal - aVal;
        } else {
            return aVal - bVal;
        }
    });

    let rowIndex = 0;
    summaryData.forEach(({id: summaryId, count, mostRecentCreated, detectionDate}) => {
        const groupAlerts = grouped[summaryId];

        // Create group header row
        const groupRowId = `group-${summaryId}`;
        const groupHeaderRow = document.createElement('tr');
        groupHeaderRow.className = 'main-row group-header';
        groupHeaderRow.onclick = () => toggleRow(groupRowId);

        // Make summary ID a clickable link if not already filtered
        const summaryIdLink = currentFilters.alertSummaryId === null
            ? `<a href="#" class="bug-link" onclick="event.stopPropagation(); applyAlertSummaryFilter(${summaryId}); return false;">${summaryId}</a>`
            : summaryId;

        groupHeaderRow.innerHTML = `
            <td>
                <button class="expand-btn" id="expand-${groupRowId}">▶</button>
            </td>
            <td>
                <strong>${summaryIdLink}</strong>
            </td>
            <td>${count}</td>
            <td>${formatDate(mostRecentCreated)}</td>
            <td>${formatDate(detectionDate)}</td>
        `;
        tbody.appendChild(groupHeaderRow);

        // Create details row with nested table showing individual alerts
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row';
        detailsRow.id = `details-${groupRowId}`;

        let detailsHTML = '<td colspan="5" class="details-cell" style="padding: 0;"><table style="width: 100%; margin: 0;">';

        // Add header for the nested table
        detailsHTML += `
            <thead style="background: #8b9ff5; color: white;">
                <tr>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 40px; cursor: default;"></th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Alert ID</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Bug</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Bug Status</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Probe</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Platform</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Push Date</th>
                </tr>
            </thead>
        `;

        detailsHTML += '<tbody>';

        groupAlerts.forEach((alert, alertIndex) => {
            const nestedRowId = `${groupRowId}-alert-${alertIndex}`;
            const bugStatusClass = getBugStatusClass(alert.bugStatus);
            const probeContent = alert.probe
                ? `<a href="https://glam.telemetry.mozilla.org/fog/probe/${encodeURIComponent(alert.probe)}/explore?os=${encodeURIComponent(alert.platform)}"
                      target="_blank"
                      class="bug-link"
                      onclick="event.stopPropagation()">${alert.probe}</a>${' '.repeat(maxProbeLength - alert.probe.length)}`
                : padProbe(null);

            // Main row for this alert
            detailsHTML += `
                <tr class="main-row" onclick="toggleRow('${nestedRowId}')" style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 8px 12px; width: 40px;">
                        <button class="expand-btn" id="expand-${nestedRowId}">▶</button>
                    </td>
                    <td style="padding: 8px 12px;">${alert.alertId}</td>
                    <td style="padding: 8px 12px;">
                        ${alert.bug ? `<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=${alert.bug}" target="_blank" class="bug-link" onclick="event.stopPropagation()">${alert.bug}</a>` : 'N/A'}
                    </td>
                    <td style="padding: 8px 12px;">
                        <span class="badge ${bugStatusClass}">${alert.bugStatus || 'N/A'}</span>
                    </td>
                    <td style="padding: 8px 12px;" class="probe-cell">${probeContent}</td>
                    <td style="padding: 8px 12px;">${alert.platform}</td>
                    <td style="padding: 8px 12px;">${formatDate(alert.pushDate)}</td>
                </tr>
            `;

            // Details row for this alert (reusing createDetailsRow logic)
            detailsHTML += createDetailsRow(alert, nestedRowId);
        });

        detailsHTML += '</tbody></table></td>';

        detailsRow.innerHTML = detailsHTML;
        tbody.appendChild(detailsRow);

        rowIndex++;
    });

    // Calculate total alerts from the filtered groups
    const totalAlerts = summaryData.reduce((sum, summary) => sum + summary.count, 0);
    const totalGroups = summaryData.length;
    document.getElementById('alert-count').textContent = `Total: ${totalGroups} group${totalGroups !== 1 ? 's' : ''} (${totalAlerts} alert${totalAlerts !== 1 ? 's' : ''})`;
    document.getElementById('alerts-table').style.display = 'table';
}

function renderAlerts(alerts) {
    if (currentView === 'grouped') {
        renderGroupedAlerts(alerts);
        return;
    }

    const tbody = document.getElementById('alerts-body');
    tbody.innerHTML = '';

    alerts.forEach((alert, index) => {
        const rowId = `row-${index}`;
        const bugStatusClass = getBugStatusClass(alert.bugStatus);

        const mainRow = document.createElement('tr');
        mainRow.className = 'main-row';
        mainRow.onclick = () => toggleRow(rowId);

        if (currentView === 'with-bugs') {
            mainRow.innerHTML = getRowHTMLWithBug(alert, rowId, bugStatusClass);
        } else {
            mainRow.innerHTML = getRowHTMLWithoutBug(alert, rowId);
        }

        tbody.appendChild(mainRow);
        tbody.insertAdjacentHTML('beforeend', createDetailsRow(alert, rowId));
    });

    const viewLabel = currentView === 'with-bugs' ? 'With Bugs' : 'Without Bugs';
    document.getElementById('alert-count').textContent = `Total Alerts (${viewLabel}): ${alerts.length}`;
    document.getElementById('alerts-table').style.display = 'table';
}

function updateTableHeaders() {
    const thead = document.querySelector('thead tr');
    const dateFromFilter = document.getElementById('date-from-filter').parentElement;
    const dateToFilter = document.getElementById('date-to-filter').parentElement;

    if (currentView === 'grouped') {
        thead.innerHTML = `
            <th></th>
            <th class="sortable" onclick="sortGroupedBy('summaryId')">Alert Summary ID</th>
            <th class="sortable" onclick="sortGroupedBy('count')">Alert Count</th>
            <th class="sortable" onclick="sortGroupedBy('mostRecent')">Last Alert Created On</th>
            <th class="sortable" onclick="sortGroupedBy('detectionDate')">Push Date</th>
        `;
        updateGroupedSortIndicators();
        // Show date filters in grouped view
        dateFromFilter.style.display = 'flex';
        dateToFilter.style.display = 'flex';
    } else if (currentView === 'with-bugs') {
        thead.innerHTML = `
            <th></th>
            <th class="sortable" onclick="sortByColumn('alertId')">Alert ID</th>
            <th class="sortable" onclick="sortByColumn('bug')">Bug</th>
            <th class="sortable" onclick="sortByColumn('bugStatus')">Bug Status</th>
            <th class="sortable" onclick="sortByColumn('probe')">Probe</th>
            <th class="sortable" onclick="sortByColumn('platform')">Platform</th>
            <th class="sortable" onclick="sortByColumn('pushDate')">Push Date</th>
        `;
        // Show date filters in with-bugs view
        dateFromFilter.style.display = 'flex';
        dateToFilter.style.display = 'flex';
    } else {
        thead.innerHTML = `
            <th></th>
            <th class="sortable" onclick="sortByColumn('alertId')">Alert ID</th>
            <th class="sortable" onclick="sortByColumn('probe')">Probe</th>
            <th class="sortable" onclick="sortByColumn('platform')">Platform</th>
            <th class="sortable" onclick="sortByColumn('pushDate')">Push Date</th>
        `;
        // Show date filters in without-bugs view
        dateFromFilter.style.display = 'flex';
        dateToFilter.style.display = 'flex';
    }

    if (currentView !== 'grouped') {
        updateSortIndicators();
    }
}

function updateView() {
    updateTableHeaders();
    const filteredAlerts = getFilteredAlerts();
    renderAlerts(filteredAlerts);
    updateURLParameter();
}

function updateURLParameter() {
    const url = new URL(window.location);
    url.searchParams.set('view', currentView);

    // Update platforms parameter
    if (currentFilters.platforms.size > 0) {
        url.searchParams.set('platforms', Array.from(currentFilters.platforms).join(','));
    } else {
        url.searchParams.delete('platforms');
    }

    // Update probe search terms parameter
    if (currentFilters.probeSearchTerms.length > 0) {
        url.searchParams.set('probe', currentFilters.probeSearchTerms.join(' '));
    } else {
        url.searchParams.delete('probe');
    }

    // Update date parameters
    if (currentFilters.dateFrom) {
        url.searchParams.set('dateFrom', currentFilters.dateFrom);
    } else {
        url.searchParams.delete('dateFrom');
    }

    if (currentFilters.dateTo) {
        url.searchParams.set('dateTo', currentFilters.dateTo);
    } else {
        url.searchParams.delete('dateTo');
    }

    // Update grouped with bugs only parameter
    if (currentFilters.groupedWithBugsOnly) {
        url.searchParams.set('groupedWithBugsOnly', 'true');
    } else {
        url.searchParams.delete('groupedWithBugsOnly');
    }

    // Update alert summary ID parameter
    if (currentFilters.alertSummaryId !== null) {
        url.searchParams.set('alertSummaryId', currentFilters.alertSummaryId);
    } else {
        url.searchParams.delete('alertSummaryId');
    }

    window.history.replaceState({}, '', url);
}

function getViewFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam && ['with-bugs', 'without-bugs', 'grouped'].includes(viewParam)) {
        return viewParam;
    }
    return 'with-bugs'; // default
}

function getFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);

    // Get platforms
    const platformsParam = urlParams.get('platforms');
    if (platformsParam) {
        currentFilters.platforms = new Set(platformsParam.split(','));
    }

    // Get probe search terms
    const probeParam = urlParams.get('probe');
    if (probeParam) {
        currentFilters.probeSearchTerms = probeParam.split(/\s+/).filter(term => term.length > 0);
    }

    // Get date filters
    const dateFromParam = urlParams.get('dateFrom');
    if (dateFromParam) {
        currentFilters.dateFrom = dateFromParam;
    }

    const dateToParam = urlParams.get('dateTo');
    if (dateToParam) {
        currentFilters.dateTo = dateToParam;
    }

    // Get grouped with bugs only filter
    const groupedWithBugsOnlyParam = urlParams.get('groupedWithBugsOnly');
    if (groupedWithBugsOnlyParam === 'true') {
        currentFilters.groupedWithBugsOnly = true;
    }

    // Get alert summary ID filter
    const alertSummaryIdParam = urlParams.get('alertSummaryId');
    if (alertSummaryIdParam) {
        currentFilters.alertSummaryId = parseInt(alertSummaryIdParam, 10);
    }
}

function setupToggleButtons() {
    const withBugsBtn = document.getElementById('toggle-bugs');
    const withoutBugsBtn = document.getElementById('toggle-no-bugs');
    const groupedBtn = document.getElementById('toggle-grouped');
    const groupedBugsBtn = document.getElementById('toggle-grouped-bugs');

    withBugsBtn.addEventListener('click', () => {
        if (currentView !== 'with-bugs') {
            currentView = 'with-bugs';
            withBugsBtn.classList.add('active');
            withoutBugsBtn.classList.remove('active');
            groupedBtn.classList.remove('active');
            groupedBugsBtn.style.display = 'none';
            updateView();
        }
    });

    withoutBugsBtn.addEventListener('click', () => {
        if (currentView !== 'without-bugs') {
            currentView = 'without-bugs';
            withoutBugsBtn.classList.add('active');
            withBugsBtn.classList.remove('active');
            groupedBtn.classList.remove('active');
            groupedBugsBtn.style.display = 'none';
            updateView();
        }
    });

    groupedBtn.addEventListener('click', () => {
        if (currentView !== 'grouped') {
            currentView = 'grouped';
            groupedBtn.classList.add('active');
            withBugsBtn.classList.remove('active');
            withoutBugsBtn.classList.remove('active');
            groupedBugsBtn.style.display = 'inline-block';
            updateView();
        }
    });

    groupedBugsBtn.addEventListener('click', () => {
        currentFilters.groupedWithBugsOnly = !currentFilters.groupedWithBugsOnly;
        if (currentFilters.groupedWithBugsOnly) {
            groupedBugsBtn.classList.add('active');
        } else {
            groupedBugsBtn.classList.remove('active');
        }
        updateView();
    });
}

function setupFilters() {
    const platforms = getUniqueValues('platform');

    populateFilter('platform', platforms);

    // Setup dropdown toggle for platform
    document.getElementById('platform-header').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown('platform');
    });

    // Setup probe text filter
    const probeInput = document.getElementById('probe-filter');
    probeInput.addEventListener('input', (e) => {
        const searchText = e.target.value.trim();
        if (searchText === '') {
            currentFilters.probeSearchTerms = [];
        } else {
            // Split by spaces and filter out empty strings
            currentFilters.probeSearchTerms = searchText.split(/\s+/).filter(term => term.length > 0);
        }
        updateView();
    });

    // Setup date filters
    const dateFromInput = document.getElementById('date-from-filter');
    const dateToInput = document.getElementById('date-to-filter');

    dateFromInput.addEventListener('input', (e) => {
        currentFilters.dateFrom = e.target.value || null;
        updateView();
    });

    dateToInput.addEventListener('input', (e) => {
        currentFilters.dateTo = e.target.value || null;
        updateView();
    });

    // Clear filters button
    document.getElementById('clear-filters').addEventListener('click', () => {
        currentFilters.platforms.clear();
        currentFilters.probeSearchTerms = [];
        currentFilters.groupedWithBugsOnly = false;
        currentFilters.dateFrom = null;
        currentFilters.dateTo = null;
        currentFilters.alertSummaryId = null;
        probeInput.value = '';
        dateFromInput.value = '';
        dateToInput.value = '';
        document.getElementById('toggle-grouped-bugs').classList.remove('active');
        updateAlertSummaryDisplay();
        updateFilterDisplay();
        updateView();
    });

    // Setup remove alert summary button
    document.getElementById('remove-alert-summary').addEventListener('click', () => {
        currentFilters.alertSummaryId = null;
        updateAlertSummaryDisplay();
        updateView();
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        closeAllDropdowns();
    });
}

function populateFilter(type, values) {
    const dropdown = document.getElementById(`${type}-dropdown`);
    dropdown.innerHTML = '';

    values.forEach(value => {
        const option = document.createElement('div');
        option.className = 'filter-option';
        option.innerHTML = `
            <input type="checkbox" id="${type}-${value}" value="${value}">
            <label for="${type}-${value}">${value}</label>
        `;

        option.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
                currentFilters[`${type}s`].add(value);
            } else {
                currentFilters[`${type}s`].delete(value);
            }
            updateFilterDisplay();
            updateView();
        });

        dropdown.appendChild(option);
    });
}

function toggleDropdown(type) {
    const dropdown = document.getElementById(`${type}-dropdown`);
    const isOpen = dropdown.classList.contains('open');

    closeAllDropdowns();

    if (!isOpen) {
        dropdown.classList.add('open');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.select-dropdown').forEach(dropdown => {
        dropdown.classList.remove('open');
    });
}

function updateFilterDisplay() {
    // Update platform header
    const platformHeader = document.getElementById('platform-header').querySelector('span');
    if (currentFilters.platforms.size === 0) {
        platformHeader.textContent = 'All Platforms';
    } else if (currentFilters.platforms.size === 1) {
        platformHeader.textContent = Array.from(currentFilters.platforms)[0];
    } else {
        platformHeader.textContent = `${currentFilters.platforms.size} selected`;
    }

    // Update checkboxes (only for platform now)
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
        const type = checkbox.id.split('-')[0];
        const value = checkbox.value;
        if (type === 'platform') {
            checkbox.checked = currentFilters.platforms.has(value);
        }
    });
}

async function init() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');

    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';

        const data = await fetchAlerts();
        allAlerts = parseData(data);
        calculateMaxProbeLength();

        loadingEl.style.display = 'none';

        if (allAlerts.length === 0) {
            errorEl.textContent = 'No alerts found.';
            errorEl.style.display = 'block';
        } else {
            // Initialize view and filters from URL parameters
            currentView = getViewFromURL();
            getFiltersFromURL();
            setupToggleButtons();
            setupFilters();
            updateToggleButtonStates();
            updateFilterUIFromState();
            updateView();
        }
    } catch (error) {
        loadingEl.style.display = 'none';
        errorEl.textContent = `Error loading alerts: ${error.message}`;
        errorEl.style.display = 'block';
    }
}

function updateToggleButtonStates() {
    const withBugsBtn = document.getElementById('toggle-bugs');
    const withoutBugsBtn = document.getElementById('toggle-no-bugs');
    const groupedBtn = document.getElementById('toggle-grouped');
    const groupedBugsBtn = document.getElementById('toggle-grouped-bugs');

    withBugsBtn.classList.remove('active');
    withoutBugsBtn.classList.remove('active');
    groupedBtn.classList.remove('active');

    if (currentView === 'with-bugs') {
        withBugsBtn.classList.add('active');
        groupedBugsBtn.style.display = 'none';
    } else if (currentView === 'without-bugs') {
        withoutBugsBtn.classList.add('active');
        groupedBugsBtn.style.display = 'none';
    } else if (currentView === 'grouped') {
        groupedBtn.classList.add('active');
        groupedBugsBtn.style.display = 'block';
    }
}

function updateFilterUIFromState() {
    // Update probe input
    const probeInput = document.getElementById('probe-filter');
    if (currentFilters.probeSearchTerms.length > 0) {
        probeInput.value = currentFilters.probeSearchTerms.join(' ');
    }

    // Update date inputs
    const dateFromInput = document.getElementById('date-from-filter');
    const dateToInput = document.getElementById('date-to-filter');
    if (currentFilters.dateFrom) {
        dateFromInput.value = currentFilters.dateFrom;
    }
    if (currentFilters.dateTo) {
        dateToInput.value = currentFilters.dateTo;
    }

    // Update grouped with bugs only button
    const groupedBugsBtn = document.getElementById('toggle-grouped-bugs');
    if (currentFilters.groupedWithBugsOnly) {
        groupedBugsBtn.classList.add('active');
    } else {
        groupedBugsBtn.classList.remove('active');
    }

    // Update alert summary ID display
    updateAlertSummaryDisplay();

    // Update filter display (for platform dropdown)
    updateFilterDisplay();
}

function updateAlertSummaryDisplay() {
    const alertSummaryGroup = document.getElementById('alert-summary-filter-group');
    const alertSummaryValue = document.getElementById('alert-summary-value');

    if (currentFilters.alertSummaryId !== null) {
        alertSummaryValue.textContent = currentFilters.alertSummaryId;
        alertSummaryGroup.style.display = 'flex';
    } else {
        alertSummaryGroup.style.display = 'none';
    }
}

function applyAlertSummaryFilter(alertSummaryId) {
    if (currentFilters.alertSummaryId === null) {
        currentFilters.alertSummaryId = alertSummaryId;
        updateAlertSummaryDisplay();
        updateView();
    }
}

document.addEventListener('DOMContentLoaded', init);
