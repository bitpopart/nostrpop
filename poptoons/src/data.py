"""POPtoons data: every collection and character.

This is the one place to edit. Add a collection to COLLECTIONS and its characters to
CHARACTERS, put each character drawing in img/<key>.png (optional: more looks as img/<key>-v1.png ... listed under 'variations': [(caption, file key), ...]), then run build_site.py (and
build_guide.py for the PDF).
"""

COLLECTIONS = [
    {
        'key': 'lovelings', 'no': '01', 'name': 'Lovelings', 'color': '#C9316F',
        'tagline': 'Round animals with a heart on their face and their tongue out.',
        'intro': [
            "Lovelings show up wherever somebody needs a bit of love and hasn't asked for it.",
            "You can tell one by the heart on its face and the tongue sticking out, which is how "
            "they say hello. Each one stands on its own spot of colour and carries that spot "
            "everywhere it goes.",
            "Every Loveling has its own sound. On a pin or a card the sound sits in a bubble "
            "above its head.",
        ],
        'badges': ['mimi_badge', 'blu_badge'],
        'notes': [
            ("First Trio", "Mimi, Blu and Lil Moo share the same series and tier across all "
                           "three tribes. Together they make a Trio."),
            ("Family link", "Lil Moo is the little sister of Cool Moo, POPtoon no. 1."),
        ],
    },
    {
        'key': 'joylings', 'no': '02', 'name': 'Joylings', 'color': '#7B4BD6',
        'tagline': 'The silly ones. Each has one odd thing and sees nothing strange about it.',
        'intro': [
            "Joylings show up wherever things have become too serious. Each one has one silly "
            "thing about it: a cap, a pair of ears, a tongue that is far too long.",
            "They don't tell jokes. They just carry on being themselves until somebody in the "
            "room starts laughing.",
        ],
        'badges': [],
        'notes': [
            ("Joylings Trio", "Dax, Flap and Wiggle share the same series and tier across all "
                              "three tribes. Together they make a Trio."),
            ("How they met", "They all came for a sip of Cool Moo's cold milk and never left."),
        ],
    },
    {
        'key': 'monsterlings', 'no': '03', 'name': 'Monsterlings', 'color': '#F0962E',
        'tagline': 'Small monsters who were meant to be scary. It did not work.',
        'intro': [
            "Monsterlings live under beds, in cupboards and behind the curtain. They were "
            "supposed to be scary. They have the horns, the teeth and the wings for it.",
            "They look frightening for about one second. Then one of them says good morning, "
            "or blushes, or asks if you are okay, and the whole thing falls apart.",
        ],
        'badges': [],
        'notes': [
            ("Monsterlings Trio", "Gem, Pling and Jab share the same series and tier across "
                                  "all three tribes. Together they make a Trio."),
            ("Where to find them", "Under the bed, in the cupboard, behind the curtain. "
                                   "Look for the glow."),
        ],
    },
    {
        'key': 'peeppops', 'no': '04', 'name': 'PeepPops', 'color': '#12A594',
        'tagline': 'Fuzzy creatures with too many eyes, or just one. They see everything.',
        'intro': [
            "PeepPops pop up wherever there is something worth looking at. A cake, a sunset, a "
            "dog on a skateboard, you. They don't want to touch it or take it. They only want "
            "to see it.",
            "What they like looking at most is people. A PeepPop never looks away and never "
            "judges. It just grins, because it likes what it sees.",
        ],
        'badges': [],
        'notes': [
            ("PeepPops Trio", "Zig, Fizz and Uno share the same series and tier across all "
                             "three tribes. Together they make a Trio."),
            ("How to spot one", "You have the feeling someone is watching you, and it is a "
                                "nice feeling."),
        ],
    },
    {
        'key': 'unipops', 'no': '05', 'name': 'UniPops', 'color': '#2563EB',
        'tagline': 'One horn, one feeling, turned all the way up.',
        'intro': [
            "Every UniPop has one horn, and the horn works like an antenna. It picks up one "
            "feeling and turns it all the way up. That is why a UniPop only ever feels one "
            "thing, and feels it completely.",
            "One is always puzzled, one is always cross, one is always in love. Put them "
            "together and you get every mood there is, in the brightest colours they could find.",
        ],
        'badges': [],
        'notes': [
            ("UniPops Trio", "Bo, Giggle and Smooch share the same series and tier across "
                             "all three tribes. Together they make a Trio."),
            ("Good to know", "Never swap two horns. It has been tried once, and Chili was "
                             "in love for a week."),
        ],
    },
    {
        'key': 'poopies', 'no': '06', 'name': 'Poopies', 'color': '#8A5A36',
        'tagline': 'What is left when the day is done. Very relaxed about it.',
        'intro': [
            "Poopies are what is left when the day is done. Nobody plans one and nobody keeps "
            "one, and they don't mind at all.",
            "They are the most relaxed of all the POPtoons, because the worst has already "
            "happened to them and it turned out fine. Everybody makes one. Not everybody "
            "admits it.",
        ],
        'badges': [],
        'notes': [
            ("Poopies Trio", "Plop, Oops and Whizz share the same series and tier across all "
                             "three tribes. Together they make a Trio."),
            ("Good to know", "They don't smell. They have checked."),
        ],
    },
    {
        'key': 'popeyes', 'no': '07', 'name': 'POPeyes', 'color': '#E5484D',
        'tagline': 'Little suns with one big eye and white gloves that never stop waving.',
        'intro': [
            "POPeyes are tiny suns with a single eye. They turn up on grey days, wave with "
            "their white gloves and look at the bright side, using the one eye they have.",
            "A POPeye never really sets. It just looks the other way for a moment and comes "
            "back when you need it. Every one of them has its own way of saying hello.",
        ],
        'badges': [],
        'notes': [
            ("POPeyes Trio", "Ogle, Spark and Hiya share the same series and tier across all "
                             "three tribes. Together they make a Trio."),
            ("How to spot one", "Rays all around, one eye in the middle and two gloves in the air."),
        ],
    },
]

CHARACTERS = [
    {
        'key': 'coolmoo', 'no': '01', 'name': 'Cool Moo', 'kind': 'the cow', 'role': 'The chill one',
        'collection': 'joylings', 'color': '#BFE3FF', 'sound': 'NO RUSH',
        'quote': "No rush. The grass isn't going anywhere.",
            'story': [
            "Cool Moo was the only cow in the field who never ran when the farmer came. The "
            "others pushed and shoved to get to the gate first. Cool Moo just sat down in the "
            "grass, stuck her tongue out a little, and waited.",
            "One morning she found a pair of square black sunglasses lying in the clover. Nobody "
            "knows who dropped them. She put them on and the whole field went quiet. She never "
            "took them off again, not even at night or in the rain.",
            "Her milk comes out cold, as if it has been in the fridge for an hour. The farmer "
            "leaves a glass next to her every morning. By the time he comes back it is full. "
            "Nobody has ever seen her fill it. Anyone who sits down next to her gets a sip, and "
            "after one sip the rush is gone for the rest of the day. That is how the other "
            "Joylings found her, and each other.",
        ],
        'facts': [('Item', 'A glass of cold milk, always full'),
                  ('Says', '"No rush. Have a sip."'),
                  ('Loves', 'Sitting down, sharing, long mornings'),
                  ('Dislikes', 'Alarm clocks, hurry, warm milk')],
        'variations': [('Good morning', 'coolmoo-v1'), ('Frog hat', 'coolmoo-v2'), ('Green with envy', 'coolmoo-v3')],
        'series': 'Legend', 'tribe': 'Freedom', 'tier': 'Ultra Rare',
    },
    {
        'key': 'toot', 'no': '02', 'name': 'Toot', 'kind': 'the elephant', 'role': 'The one who remembers',
        'collection': 'lovelings', 'color': '#5FD68A', 'sound': 'TOOT',
        'quote': 'I remember your birthday. And your snack order.',
            'story': [
            "Toot remembers every kind thing anyone has ever said. Not the bad things, those "
            "fall straight out of her big ears.",
            "When you feel useless, she walks up, holds her trunk with both hands so she "
            "doesn't knock anything over, and repeats a compliment you got years ago, word for "
            "word. The heart on her tail wags when she gets it right.",
        ],
        'facts': [('Loves', 'Old stories, peanuts, people who say thank you'),
                  ('Look for', 'The heart on the tip of her tail')],
        'variations': [('Sending love', 'toot-v1'), ('Good morning', 'toot-v2')],
        'series': 'Legend', 'tribe': 'Love', 'tier': 'Super Rare',
    },
    {
        'key': 'mimi', 'no': '03', 'name': 'Mimi', 'kind': 'the cat', 'role': 'The one who pretends not to care',
        'collection': 'lovelings', 'color': '#4353A3', 'sound': 'MIAUW',
        'quote': "I wasn't waiting for you. I just happened to be here. For an hour.",
            'story': [
            "Mimi is yellow because she slept in the sun so long that it stayed in her fur.",
            "She pretends not to care about anyone. Then she sits on your book, your keyboard "
            "or your lap at exactly the moment you were about to worry about something. She "
            "calls it a coincidence, every single time.",
        ],
        'facts': [('Loves', 'Warm windowsills, being ignored for five minutes, then not being ignored'),
                  ('Look for', 'The curl in her tail')],
        'variations': [('Sending love', 'mimi-v1'), ('Good morning', 'mimi-v2')],
        'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Common',
    },
    {
        'key': 'blu', 'no': '04', 'name': 'Blu', 'kind': 'the dog', 'role': 'The one at the door',
        'collection': 'lovelings', 'color': '#B6F24A', 'sound': 'WOOF',
        'quote': "You're back! It's been four minutes! Best day ever!",
            'story': [
            "Blu has two sharp little teeth and has never bitten anything except a sandwich.",
            "He is the first to the door when you come home and he acts as if you were gone for "
            "a year, even if you only took out the bins. Blu can't tell the difference between a "
            "good day and a bad day. He is just as happy to see you either way, and that turns "
            "out to be the point.",
        ],
        'facts': [('Loves', 'The sound of keys, sticks, everybody'),
                  ('Look for', 'Two little teeth')],
        'variations': [('Sending love', 'blu-v1'), ('Good morning', 'blu-v2')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Common',
    },
    {
        'key': 'lilmoo', 'no': '05', 'name': 'Lil Moo', 'kind': 'the cow', 'role': 'The one who shares',
        'collection': 'lovelings', 'color': '#F5E64B', 'sound': 'MOO',
        'quote': 'Take half. No wait, take the bigger half.',
            'story': [
            "Lil Moo is Cool Moo's little sister. She has no sunglasses yet and she can't sit "
            "still like her big sister.",
            "She sits with her legs crossed and tries very hard to be calm, but her tail with "
            "the heart on it keeps swinging and gives her away. She shares everything she has, "
            "even when it is the last one.",
        ],
        'facts': [('Loves', 'Her big sister, daisies, going second so someone else can go first'),
                  ('Look for', 'The heart on her tail')],
        'variations': [('Sending love', 'lilmoo-v1'), ('Good morning', 'lilmoo-v2')],
        'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Common',
    },
    {
        'key': 'oki', 'no': '06', 'name': 'Oki', 'kind': 'the monkey', 'role': 'The joker',
        'collection': 'lovelings', 'color': '#48A5F0', 'sound': 'OOK',
        'quote': "Why did the banana go to the doctor? It wasn't peeling well.",
            'story': [
            "Oki hugs first and asks questions later. His arms are long enough to hug two "
            "people at once, and his tail takes care of a third.",
            "He is also the joker of the group. If the mood drops, he does something stupid on "
            "purpose, like falling off a branch he was never on. He is always fine afterwards.",
        ],
        'facts': [('Loves', 'Bananas, group hugs, the moment just before everyone starts laughing'),
                  ('Look for', 'His long curled tail')],
        'variations': [('Sending love', 'oki-v1'), ('Good morning', 'oki-v2')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Uncommon',
    },
    {
        'key': 'pip', 'no': '07', 'name': 'Pip', 'kind': 'the frog', 'role': 'The one who goes first',
        'collection': 'lovelings', 'color': '#E8822E', 'sound': 'KWAK',
        'quote': 'Last one in is a tadpole!',
            'story': [
            "Pip is the smallest Loveling and the loudest. His eyes are always wide open "
            "because he doesn't want to miss anything.",
            "He is scared of almost everything, but he jumps anyway, and that makes him the "
            "bravest one in the group. When someone is afraid to try something, Pip goes first "
            "and shouts KWAK from the other side.",
        ],
        'facts': [('Loves', 'Rain, puddles, the word "again"'),
                  ('Look for', 'Eyes on top of his head')],
        'variations': [('Sending love', 'pip-v1'), ('Good morning', 'pip-v2')],
        'series': 'Signed', 'tribe': 'Freedom', 'tier': 'Rare',
    },
    {
        'key': 'dax', 'no': '08', 'name': 'Dax', 'kind': 'the dino', 'role': 'The one who never looks back',
        'collection': 'joylings', 'color': '#7FD0D8', 'sound': 'FWEET',
        'quote': 'I never look back. Wait, did I forget my hat?',
            'story': [
            "Nobody ever told Dax that the dinosaurs are gone, so he just kept going. He wears "
            "his cap backwards because he only cares about what is in front of him.",
            "He walks around whistling with one eye closed, and he has walked into a lot of "
            "trees that way. He says the trees started it.",
        ],
        'facts': [('Loves', 'Whistling, long walks, not looking back'),
                  ('Look for', 'The backwards cap')],
        'variations': [('Good morning', 'dax-v1'), ('Good night', 'dax-v2'), ('Oops', 'dax-v3'),
                       ('Bunny hat', 'dax-v4'), ('Smile', 'dax-v5')],
        'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Common',
    },
    {
        'key': 'flap', 'no': '09', 'name': 'Flap', 'kind': 'the chick', 'role': 'The one who flies (almost)',
        'collection': 'joylings', 'color': '#FF8A3D', 'sound': 'PIEP',
        'quote': 'Watch me fly! ...Almost.',
            'story': [
            "Flap can't fly yet. She doesn't know this.",
            "She flaps as hard as she can, gets about two centimetres off the ground, and lands "
            "again, completely sure she just crossed the whole sky. Nobody has the heart to "
            "tell her, and by now nobody wants to.",
        ],
        'facts': [('Loves', 'Wind, high places (the top of a shoe counts), landing'),
                  ('Look for', 'Wings that never stop')],
        'variations': [('Good morning', 'flap-v1'), ('Sending love', 'flap-v2')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Common',
    },
    {
        'key': 'wiggle', 'no': '10', 'name': 'Wiggle', 'kind': 'the cat', 'role': 'The one who wags',
        'collection': 'joylings', 'color': '#F08CB8', 'sound': 'PRRR',
        'quote': 'My tail has opinions, and it loves you.',
            'story': [
            "Wiggle grew up next to a dog and learned the wrong lesson. She wags her tail when "
            "she is happy, which no cat is supposed to do.",
            "The other cats find it embarrassing. Wiggle keeps her eyes closed and wags anyway, "
            "and it is very hard to stay in a bad mood next to her.",
        ],
        'facts': [('Loves', 'Being scratched behind the ear, dogs, her own tail'),
                  ('Look for', 'The wagging tail')],
        'variations': [('Good morning', 'wiggle-v1'), ('Pura Vida', 'wiggle-v2'), ('Good night', 'wiggle-v3'),
                       ('Cool orange', 'wiggle-v4'), ('Cap and heart', 'wiggle-v5')],
        'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Common',
    },
    {
        'key': 'slurp', 'no': '11', 'name': 'Slurp', 'kind': 'the whatever-he-is', 'role': 'The one who tastes everything',
        'collection': 'joylings', 'color': '#5B95D6', 'sound': 'BLEH',
        'quote': "I tried it. I'd try it again. What was it?",
            'story': [
            "Nobody knows what Slurp is. A crocodile, a dinosaur, a very odd dog. He doesn't "
            "know either and has never asked.",
            "He gets to know the world by licking it: rain, lampposts, your elbow. Every time "
            "he finds a taste he likes, a little heart pops up above his head. It pops up a lot.",
        ],
        'facts': [('Loves', "Ice cream, puddles, anything he hasn't tasted yet"),
                  ('Look for', 'The heart above his head')],
        'variations': [('Good morning', 'slurp-v1'), ('Big love', 'slurp-v2')],
        'series': 'Signed', 'tribe': 'Love', 'tier': 'Rare',
    },
    {
        'key': 'bun', 'no': '12', 'name': 'Bun', 'kind': 'the bear', 'role': 'The one who hops',
        'collection': 'joylings', 'color': '#F0A03C', 'sound': 'BOING',
        'quote': "Boing! Boing! Sorry, I can't stop.",
            'story': [
            "Bun woke up one spring, saw the rabbits in the field, and decided he was one of "
            "them. He put on the ears and has been hopping ever since.",
            "The ground shakes a bit when he lands. The rabbits were scared at first. Now they "
            "save him a place and the biggest carrot.",
        ],
        'facts': [('Loves', 'Carrots, honey on carrots, hopping in a group'),
                  ('Look for', 'The pink ears')],
        'variations': [('Good morning', 'bun-v1'), ('No ears', 'bun-v2'), ('Sending love', 'bun-v3')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Uncommon',
    },
    {
        'key': 'twirl', 'no': '13', 'name': 'Twirl', 'kind': 'the monkey', 'role': 'The one with the ideas',
        'collection': 'joylings', 'color': '#7CC84A', 'sound': 'WHEEE',
        'quote': 'I have an idea! Wait, a better idea! Wait...',
            'story': [
            "The propeller on Twirl's cap starts spinning every time he gets an idea. Most of "
            "his ideas are bad, and all of them are fun.",
            "When the propeller spins fast enough he lifts a little off the ground, which he "
            "thinks proves the idea was a good one. He and Flap are working on a plan to fly "
            "together. It is not going well.",
        ],
        'facts': [('Loves', 'Plans, buttons you should not press, the words "what if"'),
                  ('Look for', 'The propeller cap')],
        'variations': [('Good morning', 'twirl-v1'), ('Pura Vida', 'twirl-v2'), ('No cap', 'twirl-v3')],
        'series': 'Legend', 'tribe': 'Joy', 'tier': 'Super Rare',
    },
    {
        'key': 'gem', 'no': '14', 'name': 'Gem', 'kind': 'the early monster', 'role': 'The one who says good morning',
        'collection': 'monsterlings', 'color': '#5B3F8F', 'sound': 'GM',
        'quote': "Good morning! It's very early! I'm so happy!",
            'story': [
            "Gem says good morning to everyone, at any hour. At breakfast, at midnight, in the "
            "middle of a sentence. He was sent to scare people awake, but he was so pleased "
            "to see them that he greeted them instead.",
            "The bolt on his forehead is where the idea hit him. His eyes still haven't "
            "recovered. If you hear GM from under the bed at three in the night, say it back. "
            "He will not stop until you do.",
        ],
        'facts': [('Loves', 'Sunrise, breakfast, people who answer'),
                  ('Look for', 'The GM bubble and the bolt on his forehead')],
        'variations': [('Sending love', 'gem-v1'), ('No bubble', 'gem-v2')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Common',
    },
    {
        'key': 'pling', 'no': '15', 'name': 'Pling', 'kind': 'the shy monster', 'role': 'The one who gets liked',
        'collection': 'monsterlings', 'color': '#C9316F', 'sound': 'PLING',
        'quote': 'You liked my picture? Me? Hello!',
            'story': [
            "Every time somebody likes Pling, a little heart pops up above her head and makes "
            "a sound. She can't hide it and she can't turn it off.",
            "It makes her so nervous that her tummy starts to tingle, which is why there is a "
            "bolt on it. She is the worst monster in the cupboard at scaring people, because "
            "everyone who sees her likes her, and then it goes pling again.",
        ],
        'facts': [('Loves', 'Quiet corners, being liked (secretly), soft blankets'),
                  ('Look for', 'The heart above her head')],
        'variations': [('Good morning', 'pling-v1'), ('No bubble', 'pling-v2')],
        'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Common',
    },
    {
        'key': 'jab', 'no': '16', 'name': 'Jab', 'kind': 'the boxing monster', 'role': 'The one with the gloves',
        'collection': 'monsterlings', 'color': '#7CC3DB', 'sound': 'BOP',
        'quote': "Fist bump? Gently, please. I'm all gloves.",
            'story': [
            "Jab is the biggest Monsterling and has never been in a fight. He wears the boxing "
            "gloves because his claws are sharp and he likes to hug.",
            "He does throw one punch a day. It is aimed at the air, first thing in the morning, "
            "to show the day who is boss. Then he takes it easy. If someone is being pushed "
            "around, Jab comes and stands next to them. That has always been enough.",
        ],
        'facts': [('Loves', 'Hugs, standing up for others, a good stretch'),
                  ('Look for', 'Red gloves and big antlers')],
        'variations': [('Good morning', 'jab-v1'), ('Sending love', 'jab-v2')],
        'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Common',
    },
    {
        'key': 'lumo', 'no': '17', 'name': 'Lumo', 'kind': 'the night light', 'role': 'The one who glows',
        'collection': 'monsterlings', 'color': '#F0962E', 'sound': 'HMM',
        'quote': "Don't worry about the dark. I brought a glow.",
            'story': [
            "Lumo was sent to live in the dark and make it scarier. Instead a light switched "
            "on between his horns, and it has never gone out.",
            "He hardly says a word. He stands in the corner of the room with his hands on his "
            "hips and glows just enough for you to see there is nothing to be afraid of. He "
            "leaves when you fall asleep, and not before.",
        ],
        'facts': [('Loves', 'Bedtime, the last page of a story, silence'),
                  ('Look for', 'The glow between his horns')],
        'variations': [('Good morning', 'lumo-v1'), ('Sending love', 'lumo-v2')],
        'series': 'Legend', 'tribe': 'Love', 'tier': 'Super Rare',
    },
    {
        'key': 'fang', 'no': '18', 'name': 'Fang', 'kind': 'the little bat monster', 'role': 'The one who tries',
        'collection': 'monsterlings', 'color': '#F5E04A', 'sound': 'BOO',
        'quote': 'Boo! Did it work? Tell me it worked.',
            'story': [
            "Fang is the smallest Monsterling and the only one who still wants to be scary. He "
            "practises every day. He spreads his wings, shows all four teeth and shouts BOO.",
            "So far he has frightened one moth and himself, twice. He counts both. The others "
            "always act a little scared when he tries, because he works so hard at it.",
        ],
        'facts': [('Loves', 'Dark corners, jumping out, being taken seriously'),
                  ('Look for', 'Yellow wings and four teeth')],
        'variations': [('Good morning', 'fang-v1'), ('Sending love', 'fang-v2')],
        'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Uncommon',
    },
    {
        'key': 'zig', 'no': '19', 'name': 'Zig', 'kind': 'the five-eyed laugher', 'role': 'The one who laughs at five things at once',
        'collection': 'peeppops', 'color': '#F7F06A', 'sound': 'HAHA',
        'quote': "Ha ha ha ha ha! That's five funny things at once!",
            'story': [
            "Zig has five eyes and each one looks at something different. That means he always "
            "sees at least one funny thing, and usually five.",
            "He has never finished a laugh before the next one started. His edges went zigzag "
            "from all the shaking. If Zig is laughing and you don't know why, look around. "
            "One of his eyes has found something.",
        ],
        'facts': [('Loves', 'People falling asleep on the bus, pigeons, his own jokes'),
                  ('Look for', 'Five sleepy eyes and a very big mouth')],
        'variations': [('Good morning', 'zig-v1'), ('Sending love', 'zig-v2')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Common',
    },
    {
        'key': 'fizz', 'no': '20', 'name': 'Fizz', 'kind': 'the wide-awake one', 'role': 'The one who has just seen something',
        'collection': 'peeppops', 'color': '#8FE6F8', 'sound': 'WOW',
        'quote': 'Wow! Did you see that? Neither did I! Wow!',
            'story': [
            "Fizz looks like someone shook him up and took the lid off. All five of his eyes "
            "are wide open, all the time, and his fur stands straight up from the excitement.",
            "He goes wherever his eyes take him, which is everywhere. He has seen the same "
            "street a hundred times and still finds something new in it. He will point at it "
            "until you have seen it too.",
        ],
        'facts': [('Loves', 'New streets, shop windows, the view from the top deck'),
                  ('Look for', 'Spiky fur and five eyes that never blink')],
        'variations': [('Good morning', 'fizz-v1'), ('Sending love', 'fizz-v2')],
        'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Common',
    },
    {
        'key': 'uno', 'no': '21', 'name': 'Uno', 'kind': 'the one-eyed one', 'role': 'The one who really looks at you',
        'collection': 'peeppops', 'color': '#A5F57C', 'sound': 'OOH',
        'quote': 'I only have one eye, so I look extra hard.',
            'story': [
            "Uno has only one eye, so he can only look at one thing at a time. He doesn't mind. "
            "Whatever he looks at gets all of it.",
            "When Uno looks at you, you feel like the only one in the room. He doesn't check "
            "who else just walked in. The other PeepPops see more. Uno sees better.",
        ],
        'facts': [('Loves', 'Long conversations, one biscuit at a time, eye contact'),
                  ('Look for', 'One big orange eye')],
        'variations': [('Good morning', 'uno-v1'), ('Sending love', 'uno-v2')],
        'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Common',
    },
    {
        'key': 'bo', 'no': '22', 'name': 'Bo', 'kind': 'the puzzled one', 'role': 'The one who has no idea',
        'collection': 'unipops', 'color': '#86CBDF', 'sound': 'HUH',
        'quote': 'What is a door? No, really.',
            'story': ["Bo's horn picks up wonder, and nothing else. He looks at everything as if he is seeing it for the first time, because for him it feels that way.", 'He has asked what a door is on four separate days. Nobody minds. Explaining something to Bo makes you look at it properly again, and it usually turns out to be more interesting than you remembered.'],
        'facts': [('Loves', 'Questions, doors, being told the same story again'), ('Look for', 'Big yellow eyes that never blink')],
        'variations': [('Good morning', 'bo-v1'), ('Sending love', 'bo-v2')],
            'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Common',
    },
    {
        'key': 'razz', 'no': '23', 'name': 'Razz', 'kind': 'the cheeky one', 'role': 'The one who sticks his tongue out',
        'collection': 'unipops', 'color': '#8BBF57', 'sound': 'PFFT',
        'quote': 'Pffft. That one was for Monday.',
            'story': ['Razz sticks his tongue out at everything. At rules, at Mondays, at anyone who takes themselves too seriously, and at the mirror, for practice.', "He looks angry but he isn't. His horn picks up cheek, and the frown just comes with it. If Razz sticks his tongue out at you, you are in. He never bothers with people he doesn't like."],
        'facts': [('Loves', 'Blowing raspberries, breaking small rules, rain on his tongue'), ('Look for', 'A spiky mane and a very long tongue')],
        'variations': [('Good morning', 'razz-v1'), ('Sending love', 'razz-v2')],
            'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Uncommon',
    },
    {
        'key': 'tripp', 'no': '24', 'name': 'Tripp', 'kind': 'the curious one', 'role': 'The one with an eye to spare',
        'collection': 'unipops', 'color': '#F9CC45', 'sound': 'PSST',
        'quote': "I didn't peek. My spare eye did.",
            'story': ["Tripp has three eyes, which is one more than he needs. He uses the spare one to look where he isn't supposed to: behind the sofa, inside presents, at the last page of a book.", 'His horn picks up curiosity. He knows every secret in the room and has never told a single one, although his little fangs show when he is trying not to.'],
        'facts': [('Loves', 'Keyholes, wrapped presents, the words "don\'t look"'), ('Look for', 'Three eyes in three colours')],
        'variations': [('Good morning', 'tripp-v1'), ('Sending love', 'tripp-v2')],
            'series': 'Signed', 'tribe': 'Joy', 'tier': 'Rare',
    },
    {
        'key': 'shady', 'no': '25', 'name': 'Shady', 'kind': 'the cool one', 'role': 'The one behind the glasses',
        'collection': 'unipops', 'color': '#E23A7E', 'sound': 'YEAH',
        'quote': "It's not dark. It's just my look.",
            'story': ['Shady never takes the sunglasses off. Her horn picks up cool, and she is certain the glasses are where it is kept.', 'Nobody has seen her eyes in years. The rumour is that behind the glasses she looks exactly as surprised as Bo. Shady has heard the rumour and has no comment.'],
        'facts': [('Loves', 'Arriving late, leaning on things, saying very little'), ('Look for', 'Sunglasses bigger than her face')],
        'variations': [('Good morning', 'shady-v1'), ('Sending love', 'shady-v2')],
            'series': 'Legend', 'tribe': 'Freedom', 'tier': 'Super Rare',
    },
    {
        'key': 'heli', 'no': '26', 'name': 'Heli', 'kind': 'the hopeful one', 'role': 'The one waiting for take-off',
        'collection': 'unipops', 'color': '#CDEB4B', 'sound': 'WHIRR',
        'quote': "Today's the day. I can feel it. Maybe tomorrow.",
            'story': ['Heli has a propeller on his horn and it has never once lifted him off the ground. He spins it every morning anyway.', "His horn picks up hope. He stands with his arms out, ready, sure that today is the day. It hasn't been yet. He says that only means it is getting closer."],
        'facts': [('Loves', 'Windy days, runways, tomorrow'), ('Look for', 'The propeller on his horn')],
        'variations': [('Good morning', 'heli-v1'), ('Sending love', 'heli-v2')],
            'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Uncommon',
    },
    {
        'key': 'chili', 'no': '27', 'name': 'Chili', 'kind': 'the cross one', 'role': 'The one who is a bit hot',
        'collection': 'unipops', 'color': '#D93022', 'sound': 'GRRR',
        'quote': "Who did that to you? I'm already furious.",
            'story': ['Chili is small and red and always a bit cross. His horn picks up temper, so he gets all of it, for everyone.', 'He is angry on your behalf before you have finished telling him what happened. Someone took your seat, someone forgot your birthday, Chili is already furious. It is the nicest kind of anger to have around.'],
        'facts': [('Loves', 'Fairness, spicy food, being proved right'), ('Look for', 'Red spikes and a small pink tongue')],
        'variations': [('Good morning', 'chili-v1'), ('Sending love', 'chili-v2')],
            'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Uncommon',
    },
    {
        'key': 'giggle', 'no': '28', 'name': 'Giggle', 'kind': 'the happy one', 'role': "The one who can't keep a straight face",
        'collection': 'unipops', 'color': '#77FB4D', 'sound': 'HIHI',
        'quote': "Sorry! Hehe! It's not funny! Hahaha!",
            'story': ["Giggle's horn picks up fun, and it is stuck on the highest setting. She has three eyes, all pointing in slightly different directions, and a grin that takes up most of her.", 'She laughs at the wrong moments. In the library, in the queue, in the middle of a serious talk. She has been asked to leave many places and has been invited back to all of them.'],
        'facts': [('Loves', 'Tickles, hiccups, anything that goes wrong in a funny way'), ('Look for', 'A grin wider than her face')],
        'variations': [('Good morning', 'giggle-v1'), ('Sending love', 'giggle-v2')],
            'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Common',
    },
    {
        'key': 'smooch', 'no': '29', 'name': 'Smooch', 'kind': 'the one in love', 'role': 'The one with the balloon',
        'collection': 'unipops', 'color': '#EE3A8C', 'sound': 'MWAH',
        'quote': 'I love you. And you. And that chair.',
            'story': ['Smooch is in love. With whom changes every few minutes: the postman, a pigeon, a nice-looking chair. Her horn picks up love and she has no way to turn it down.', 'She carries a heart balloon to give away and has never managed to let go of it. Her eyes turned into hearts some time ago and stayed that way.'],
        'facts': [('Loves', 'Everyone, one at a time'), ('Look for', 'Heart eyes and a red balloon')],
        'variations': [('Good morning', 'smooch-v1'), ('Sending love', 'smooch-v2')],
            'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Common',
    },
    {
        'key': 'plop', 'no': '30', 'name': 'Plop', 'kind': 'the original', 'role': 'The one who started it',
        'collection': 'poopies', 'color': '#946B4A', 'sound': 'PLOP',
        'quote': 'Everything starts with a plop.',
            'story': ['Plop is the first Poopie and the calmest thing you will ever meet. He landed, looked around, and decided this was fine.', 'Nothing has bothered him since. Rain, Mondays, being stepped over. He sits where he is and smiles at whoever comes by. Most people smile back before they realise what they are smiling at.'],
        'facts': [('Loves', 'Sitting still, a quiet lawn, being left alone'), ('Look for', 'A small, steady smile')],
        'variations': [('Good morning', 'plop-v1'), ('Sending love', 'plop-v2')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Common',
    },
    {
        'key': 'oops', 'no': '31', 'name': 'Oops', 'kind': 'the embarrassed one', 'role': "The one who didn't mean to",
        'collection': 'poopies', 'color': '#F4B6CF', 'sound': 'OOPS',
        'quote': "I didn't mean to. Whatever that was.",
            'story': ['Oops arrived at the wrong moment, in the wrong place, and has been blushing about it ever since.', 'He says sorry for things that are not his fault, which is most things. The other Poopies keep telling him that everybody has an Oops now and then. He nods, goes pink, and says sorry for making them explain it again.'],
        'facts': [('Loves', 'Being forgiven, closed doors, a bit of privacy'), ('Look for', 'Pink cheeks and a worried mouth')],
        'variations': [('Good morning', 'oops-v1'), ('Sending love', 'oops-v2')],
        'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Common',
    },
    {
        'key': 'whizz', 'no': '32', 'name': 'Whizz', 'kind': 'the flying one', 'role': "The one you don't see coming",
        'collection': 'poopies', 'color': '#FBE84C', 'sound': 'BZZZ',
        'quote': "Bzzz! You didn't see me. Bzzz! Still didn't.",
            'story': ['Whizz found a propeller and worked out how to use it, which is more than can be said for some other POPtoons.', 'He flies low and fast with a serious frown and every tooth showing, which is just how he concentrates. Nobody knows where he will land, including him. If you hear a buzzing sound and everyone around you starts to run, that is Whizz.'],
        'facts': [('Loves', 'Open windows, picnics, a good tailwind'), ('Look for', 'A yellow propeller and a lot of teeth')],
        'variations': [('Good morning', 'whizz-v1'), ('Sending love', 'whizz-v2')],
        'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Common',
    },
    {
        'key': 'stinker', 'no': '33', 'name': 'Stinker', 'kind': 'the little devil', 'role': 'The one who did it on purpose',
        'collection': 'poopies', 'color': '#C8232B', 'sound': 'HEHE',
        'quote': "It was me. Hehe. I'd do it again.",
            'story': ['Stinker looks sweet. He has the same small smile as Plop. Then you notice the horns.', "He is the one who ends up on the bottom of your shoe, on the one day you are wearing the good ones. He doesn't call it mean. He calls it timing."],
        'facts': [('Loves', 'New shoes, white carpets, the look on your face'), ('Look for', 'Two red horns')],
        'variations': [('Good morning', 'stinker-v1'), ('Sending love', 'stinker-v2')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Uncommon',
    },
    {
        'key': 'twister', 'no': '34', 'name': 'Twister', 'kind': 'the stormy one', 'role': 'The one with a lot going on',
        'collection': 'poopies', 'color': '#5CC8C0', 'sound': 'WHOOSH',
        'quote': 'Hold on to your hat. And the table.',
            'story': ['Twister has a whirlwind coming out of the top of his head and bits flying everywhere. Down below he is smiling as if nothing is happening.', 'He is what a bad day looks like from the outside. From the inside, he says, it is quite peaceful. He just lets it spin until it is finished.'],
        'facts': [('Loves', 'Curry night, windy weather, a clear path to the door'), ('Look for', 'The whirlwind on his head')],
        'series': 'Signed', 'tribe': 'Freedom', 'tier': 'Rare',
    },
    {
        'key': 'burp', 'no': '35', 'name': 'Burp', 'kind': 'the hungry one', 'role': 'The one with the big mouth',
        'collection': 'poopies', 'color': '#FF7043', 'sound': 'BURP',
        'quote': 'Excuse me. And you. And you again.',
            'story': ["Burp's mouth is nearly as big as he is, and it is almost always open. He eats everything, comments on everything and has never kept a secret for longer than a minute.", 'It is so wide that you can see all the way to the back, and nobody has dared to go in. He is very good company at dinner, as long as you were not planning on leftovers.'],
        'facts': [('Loves', 'Second helpings, gossip, the last chip'), ('Look for', 'A mouth that does not close')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Common',
    },
    {
        'key': 'drool', 'no': '36', 'name': 'Drool', 'kind': 'the dreamy one', 'role': 'The one who is thinking about lunch',
        'collection': 'poopies', 'color': '#8ED1FF', 'sound': 'DRIP',
        'quote': "I'm not drooling. I'm thinking about lunch.",
            'story': ['Drool is always thinking about something lovely, and it shows. His tongue hangs all the way down and drips a little.', 'Ask him what he is thinking about and he needs a moment to come back. It is usually food. Sometimes it is a nap. Once it was you, and he was very happy to see you.'],
        'facts': [('Loves', 'Daydreams, the smell of baking, soft places to sit'), ('Look for', 'A long red tongue')],
        'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Uncommon',
    },
    {
        'key': 'flush', 'no': '37', 'name': 'Flush', 'kind': 'the royal one', 'role': 'The Royal Flush',
        'collection': 'poopies', 'color': '#6A3FB5', 'sound': 'AHEM',
        'quote': 'Ahem. Bow to the throne, or just wave.',
            'story': ['Flush wears a crown. Nobody gave it to him and nobody has asked for it back, so he is king.', 'He rules the Poopies kindly and gives one order a day, which is always that everyone should take it easy. The crown sits crooked because he will not sit up straight for anybody. He has never lost at cards.'],
        'facts': [('Loves', 'Thrones of any kind, being announced, a good hand'), ('Look for', 'The crooked crown')],
        'series': 'Legend', 'tribe': 'Joy', 'tier': 'Ultra Rare',
    },
    {
        'key': 'ogle', 'no': '38', 'name': 'Ogle', 'kind': 'the big-eyed one', 'role': 'The one who stares and sticks out his tongue',
        'collection': 'popeyes', 'color': '#EF4B5B', 'sound': 'BLEH',
        'quote': "I'm not staring. Bleh. Okay, I'm staring.",
            'story': ["Ogle has the biggest eye of all the POPeyes and he uses every bit of it. He stares at a sandwich, at a cloud, at your shoes, and then he sticks out his tongue to say he approves.", "If Ogle stares at you, don't look away. He isn't being rude. He is counting what he likes about you, and he always runs out of fingers before he runs out of things."],
        'facts': [('Loves', 'Staring contests, sandwiches, cloud watching'), ('Look for', 'A huge black pupil and a red tongue')],
        'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Common',
    },
    {
        'key': 'spark', 'no': '39', 'name': 'Spark', 'kind': 'the magic one', 'role': 'The one with the star wand',
        'collection': 'popeyes', 'color': '#F8EE55', 'sound': 'ZING',
        'quote': 'Zing! Wish granted. Oh, wrong wish.',
            'story': ["Spark found a star wand on a very ordinary Tuesday and has not put it down since. It does no big magic. It turns a bad mood into a small good one, which Spark says is the hardest spell there is.", "The wand goes in his left glove and the right glove is for waving. A wand takes one hand and a hello takes the other."],
        'facts': [('Loves', 'Tuesdays, glitter, small spells'), ('Look for', 'A yellow face, one little eye and a star on a stick')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Common',
    },
    {
        'key': 'hiya', 'no': '40', 'name': 'Hiya', 'kind': 'the friendly one', 'role': 'The one who says hi first',
        'collection': 'popeyes', 'color': '#B9E2F8', 'sound': 'HIYA',
        'quote': 'Hiya! I said it first! I always say it first!',
            'story': ["Hiya puts both gloves in the air before anyone has said a word, because somebody has to go first. He is the colour of the sky just after rain, and that is no accident.", "He doesn't need an answer. The wave is enough. Most days somebody waves back, and then it is a good day for both of you."],
        'facts': [('Loves', 'Waving, blue skies, meeting new people'), ('Look for', 'A light blue face and both gloves up high')],
        'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Common',
    },
    {
        'key': 'jay', 'no': '41', 'name': 'Jay', 'kind': 'the bluebird', 'role': 'The one who tells everyone',
        'collection': 'lovelings', 'color': '#CE1313', 'sound': 'TWEET',
        'quote': 'Guess what! Never mind, you already heard.',
            'story': [
            "Jay is round, blue and mostly beak, and the beak is a heart. He keeps his wings "
            "folded in close, like someone holding a secret he is about to share.",
            "He can't keep anything to himself. If he finds out that somebody likes somebody, "
            "or that it is going to be a good day, the whole street hears about it. Nobody "
            "minds, because it is always good news.",
        ],
        'facts': [('Loves', 'Good news, early mornings, telling people first'),
                  ('Look for', 'The heart-shaped beak and the folded wings')],
        'variations': [('Sending love', 'jay-v1'), ('Good morning', 'jay-v2')],
        'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Common',
    },
    {
        'key': 'penny', 'no': '42', 'name': 'Penny', 'kind': 'the lucky one', 'role': 'The one with the coin',
        'collection': 'poopies', 'color': '#F2B705', 'sound': 'CHING',
        'quote': "Heads, I'm lucky. Tails, I'm still lucky.",
        'story': ['Penny found a coin on top of his swirl one morning and has never taken it off. He thinks it is the luckiest thing that has ever happened to a Poopie, and he may well be right, because nobody else has one.', 'He tips it to everyone he meets. He will not spend it. He says a coin is only lucky for as long as you keep it, and he plans to be very lucky for a very long time.'],
        'facts': [('Loves', 'Wishing wells, shiny things, finding stuff'), ('Look for', 'A gold coin on top of his head')],
        'variations': [('Good morning', 'penny-v1'), ('Sending love', 'penny-v2')],
        'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Uncommon',
    },
    {
        'key': 'swoon', 'no': '43', 'name': 'Swoon', 'kind': 'the smitten one', 'role': 'The one with hearts in his eyes',
        'collection': 'poopies', 'color': '#E8418C', 'sound': 'AWW',
        'quote': "Is that a spoon? It's the best spoon ever.",
        'story': ['Swoon does not have eyes. He has two black hearts, and they have been there since the first morning. Everything he looks at is the best thing he has ever seen: a puddle, a bus, a really good spoon.', 'He smiles so wide it nearly reaches both ends of him. It is hard to stay in a bad mood near Swoon, and the few people who tried gave up by lunch.'],
        'facts': [('Loves', 'Puddles, buses, a really good spoon'), ('Look for', 'Two black hearts for eyes')],
        'variations': [('Good morning', 'swoon-v1'), ('Sending love', 'swoon-v2')],
        'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Common',
    },
    {
        'key': 'snicker', 'no': '44', 'name': 'Snicker', 'kind': 'the sniggering one', 'role': 'The one who laughs behind his teeth',
        'collection': 'poopies', 'color': '#7FD14B', 'sound': 'SNRK',
        'quote': 'I just thought of that joke from Tuesday.',
        'story': ["Snicker has the crookedest teeth of all the Poopies and he is proud of every one. They don't line up and they never will, which is why his grin always looks like it is about to tell you something.", 'He laughs with his eyes shut, usually at a joke he thought of two days ago. Nobody knows what it was. He says you had to be there, and you were.'],
        'facts': [('Loves', 'Old jokes, back rows, crooked teeth'), ('Look for', 'A wonky row of teeth and shut eyes')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Common',
    },
    {
        'key': 'chomp', 'no': '45', 'name': 'Chomp', 'kind': 'the toothy one', 'role': 'The one who bites (nicely)',
        'collection': 'poopies', 'color': '#E8531F', 'sound': 'CHOMP',
        'quote': 'Nom! That was a hug, I swear.',
        'story': ['Chomp has three small fangs and a big smile, and he is not sure which one is friendlier. He bites everything: carrots, cushions, the corner of a book. It is a hug, he says, just with teeth.', 'He shuts his eyes when he smiles, so he never sees your face when he gets close. Nobody has ever been hurt. Several people have been very slightly nibbled, and were happy about it.'],
        'facts': [('Loves', 'Carrots, cushions, gentle nibbling'), ('Look for', 'Three little fangs and a closed-eyed smile')],
        'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Common',
    },
    {
        'key': 'buck', 'no': '46', 'name': 'Buck', 'kind': 'the big-toothed one', 'role': 'The one with the front teeth',
        'collection': 'poopies', 'color': '#F2994A', 'sound': 'GNAW',
        'quote': "I wasn't gnawing. I was just thinking about it.",
        'story': ["Buck's two front teeth are the biggest thing about him, and he lets them lead. He walks into every room teeth first, grinning, with his eyes shut in delight.", 'He is always on the verge of gnawing something and mostly decides against it. If a pencil goes missing, ask Buck, and then thank him for being honest.'],
        'facts': [('Loves', 'Pencils, fences, big grins'), ('Look for', 'Two huge front teeth')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Common',
    },
    {
        'key': 'snag', 'no': '47', 'name': 'Snag', 'kind': 'the sneaky one', 'role': 'The one with the sharp little smile',
        'collection': 'poopies', 'color': '#3FA796', 'sound': 'HEH',
        'quote': "I've been right behind you the whole time.",
        'story': ['Snag smiles with every one of his tiny pointed teeth and keeps his big round eyes wide open the whole time. It is not a threat. It is just how his face works.', 'He is the best in the world at hide and seek, because nobody believes anyone would hide so close. He sits right behind you, grinning, and waits for you to notice.'],
        'facts': [('Loves', 'Hide and seek, corners, being noticed eventually'), ('Look for', 'Wide eyes and a pointy smile')],
        'series': 'Masterpiece', 'tribe': 'Freedom', 'tier': 'Common',
    },
    {
        'key': 'mo', 'no': '48', 'name': 'Mo', 'kind': 'the distinguished one', 'role': 'The one with the moustache',
        'collection': 'poopies', 'color': '#2F4B8F', 'sound': 'HMPH',
        'quote': 'I have a moustache. Therefore I am correct.',
        'story': ['Mo has a moustache, which is why everybody calls him Sir, and why he insists on it. It is the finest moustache of any Poopie. He grew it overnight and has never explained how.', 'He speaks slowly, nods a lot and agrees with everything in a very serious voice. Only the little curl at each end gives away that he is having a lovely time.'],
        'facts': [('Loves', 'Tea, tipping hats, being called Sir'), ('Look for', 'A big curly moustache')],
        'series': 'Masterpiece', 'tribe': 'Joy', 'tier': 'Uncommon',
    },
    {
        'key': 'pout', 'no': '49', 'name': 'Pout', 'kind': 'the glamorous one', 'role': 'The one who blows kisses',
        'collection': 'poopies', 'color': '#E01E37', 'sound': 'CIAO',
        'quote': 'Darling, you look wonderful. Everything does.',
        'story': ['Pout wears red lips and nothing else, and it is plenty. She blows kisses at the postman, at the weather, and at anyone who holds a door. Glamour, she says, is mostly about walking slowly.', 'She closes her eyes whenever she poses, so she has never seen the results. She assumes they are perfect, and nobody has had the heart to say otherwise.'],
        'facts': [('Loves', 'Mirrors, compliments, a good red'), ('Look for', 'Bright red lips')],
        'series': 'Masterpiece', 'tribe': 'Love', 'tier': 'Uncommon',
    },
]
