"use client";
import { useState, useEffect } from "react";

export function FunFact() {
  const [fact, setFact] = useState(getRandomFact());

  useEffect(() => {
    const interval = setInterval(() => {
      setFact(getRandomFact());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-6 bg-purple-200 border-4 border-black p-3 sm:p-4 rounded-xl transform -rotate-1">
      <h3 className="text-lg sm:text-xl font-bold mb-2">Fun Fact!</h3>
      <p className="text-base sm:text-lg">{fact}</p>
    </div>
  );
}

export function getRandomFact() {
  const facts = [
    "The world's longest concert lasted 639 hours and 5 minutes.",
    "The first song ever sung in space was 'Jingle Bells'.",
    "The most expensive musical instrument sold for $15.9 million (a Stradivarius violin).",
    "Listening to music can temporarily reduce chronic pain by up to 21%.",
    "Playing a musical instrument can increase your IQ by up to 7 points.",
    "The shortest song ever recorded is 'You Suffer' by Napalm Death, lasting 1.316 seconds.",
    "Cows produce more milk when listening to slow music.",
    "The 'Happy Birthday' song was copyrighted for 80 years until 2016.",
    "Mozart could write an entire concerto at the age of five.",
    "Your heartbeat changes and mimics the music you listen to.",
    "The most expensive music video ever made was 'Scream' by Michael and Janet Jackson, costing $7 million.",
    "The longest officially released song is 'The Rise and Fall of Bossanova (A 13:23:32 song)' by PC III.",
    "Singing releases endorphins, oxytocin, and dopamine in the brain, making you happier.",
    "The loudest band in the world is KISS, reaching 136 decibels in a 2009 concert.",
    "Music can help plants grow faster and healthier.",
    "The Beatles have sold over 600 million records worldwide.",
    "The harmonica is the world's best-selling music instrument.",
    "The longest guitar solo ever recorded lasted for 24 hours and 18 minutes.",
    "Listening to music while working out can increase your endurance by up to 15%.",
    "The human voice is the only musical instrument that can imitate all other instruments.",
    "The most expensive concert ticket ever sold was for $3.3 million.",
    "Playing the didgeridoo can help treat sleep apnea.",
    "The first known musical instrument was the flute, dating back 43,000 years.",
    "Metallica is the first and only band to have played on all seven continents.",
    "The 'Mozart Effect' suggests that listening to Mozart can temporarily boost IQ scores.",
    "The best-selling album of all time is Michael Jackson's 'Thriller'.",
    "Music can help reduce the effects of Alzheimer's disease.",
    "The longest officially released song title has 1,022 characters.",
    "Singing in a choir can improve your mood as much as yoga.",
    "The most expensive guitar ever sold was Jimi Hendrix's Fender Stratocaster for $2 million.",
    "The term 'music' comes from the Greek word 'mousike', meaning 'art of the Muses'.",
    "Playing music can help premature babies gain weight faster.",
    "The world's largest playable guitar is 43 feet long and 16 feet wide.",
    "Listening to music can help improve your memory and cognitive performance.",
    "The bagpipes were originally used as a weapon of war to scare enemies.",
    "The first pop song to use a synthesizer was 'Born to Be Wild' by Steppenwolf.",
    "Music can help reduce anxiety in hospital patients by up to 65%.",
    "The world's smallest violin is just 1/64th the size of a full-scale violin.",
    "The 'Mosquito Alarm' uses a high-frequency tone that only young people can hear.",
    "Playing an instrument can help improve your mathematical ability.",
    "The longest drum solo lasted for 738 hours and 55 minutes.",
    "Music therapy can help stroke patients regain their speech.",
    "The most expensive piano ever sold was for $3.22 million.",
    "The human ear can distinguish between hundreds of thousands of different sounds.",
    "Listening to music can increase the amount of antibodies in your body.",
    "The first music was created in Africa about 55,000 years ago.",
    "Playing music can help children develop better social skills.",
    "The world's largest orchestra had 7,548 musicians playing together.",
    "Listening to music can help reduce chronic pain by up to 21%.",
    "The phonograph, invented by Thomas Edison in 1877, was the first device to record sound.",
    "Music can help plants grow faster and produce more crops.",
    "The longest continuous radio airplay of one artist lasted for 183 hours, featuring only Grateful Dead songs.",
    "Listening to music can help improve your sleep quality.",
    "The didgeridoo is one of the oldest wind instruments, dating back over 40,000 years.",
    "Music can help reduce the perception of effort during workouts by up to 12%.",
    "The world's largest drum measures 18 feet in diameter and weighs over 7 tons.",
    "Listening to music can increase endurance during exercise by up to 15%.",
    "The most expensive CD ever made was 'Once Upon a Time in Shaolin' by Wu-Tang Clan, sold for $2 million.",
    "Playing a musical instrument can delay the onset of dementia by up to 3.7 years.",
    "The loudest animal on Earth is the sperm whale, producing sounds up to 230 decibels.",
    "Music has been shown to reduce stress levels by up to 65%.",
    "The world's largest music collection belongs to a Brazilian businessman with over 8 million items.",
    "Listening to music can help improve your immune system function.",
    "The first music video broadcast on MTV was 'Video Killed the Radio Star' by The Buggles.",
    "Playing music can help children develop better language skills.",
    "The longest-running music show on TV is 'Top of the Pops', which aired for 42 years.",
    "The first CD pressed in the United States was Bruce Springsteen's 'Born in the U.S.A.'",
    "The human brain processes music in both hemispheres simultaneously.",
    "The world's oldest known musical instrument is a 43,000-year-old flute made from a bear femur.",
    "The 'Amen Break' is the most sampled drum beat in music history.",
    "The longest-held note in a song is 115.7 seconds, achieved by Rage Against the Machine's Tom Morello.",
    "The first-ever platinum album was Eagles' 'Their Greatest Hits (1971-1975)'.",
    "The 'Wilhelm Scream' is a famous sound effect used in over 400 films and TV series.",
    "The most expensive musical instrument is the 'Lady Blunt' Stradivarius violin, sold for $15.9 million.",
    "The longest officially released song is 'The Rise and Fall of Bossanova (A 13:23:32 song)' by PC III.",
    "The first-ever music video was made in 1894 for 'The Little Lost Child'.",
    "The 'Loudness War' refers to the trend of increasing audio levels in recorded music.",
    "The world's largest playable turntable is 25 feet in diameter.",
    "The longest applause recorded lasted for 1 hour and 20 minutes at a Luciano Pavarotti concert.",
    "The first-ever digital download single to sell 1 million copies was 'I Gotta Feeling' by The Black Eyed Peas.",
    "The most expensive album cover ever produced was for Sgt. Pepper's Lonely Hearts Club Band by The Beatles.",
    "The world's largest musical instrument is the Stalacpipe Organ in Virginia's Luray Caverns.",
    "The first song played on Mars was will.i.am's 'Reach for the Stars' in 2012.",
    "The longest title for a music album contains 156 words.",
    "The first-ever gold record was awarded to 'Chattanooga Choo Choo' by Glenn Miller in 1942.",
    "The world's smallest playable violin is just 1 inch long.",
    "The longest echo in a man-made structure lasts for 75 seconds.",
    "The first-ever music streaming service was launched in 1993 called 'Internet Underground Music Archive'.",
    "The world's largest bass drum is 20 feet in diameter and weighs 7,760 pounds.",
    "The longest continuous live radio broadcast of a single artist was 183 hours, featuring only Grateful Dead songs.",
    "The first-ever music video to reach one billion views on YouTube was 'Gangnam Style' by Psy.",
    "The world's largest collection of music memorabilia contains over 1 million items.",
    "The longest-running number one single on the US Billboard Hot 100 is 'Old Town Road' by Lil Nas X.",
    "The first-ever digital single to sell 1 million copies in the UK was 'Do They Know It's Christmas?' by Band Aid 20.",
    "The world's largest functioning musical instrument is the Great Stalacpipe Organ in Virginia's Luray Caverns.",
    "The longest marathon playing drums lasted 738 hours and 55 minutes.",
    "The first-ever song to be played in space was 'Jingle Bells' on a harmonica in 1965.",
    "The world's largest playable guitar is 43 feet long and 16 feet wide.",
    "The longest continuous DJ set lasted for 240 hours.",
    "The first-ever song to be registered for copyright was 'The Castle of Dromore' in 1877.",
    "The world's largest collection of Beatles memorabilia contains over 8,500 items.",
    "The longest concert by a solo artist lasted 60 hours and 7 minutes.",
    "The first-ever platinum-certified ringtone was 'Candy Shop' by 50 Cent featuring Olivia.",
    "The world's largest musical festival, Donauinselfest in Vienna, attracts over 3 million visitors annually.",
    "The longest-running music radio show is 'Grand Ole Opry', which has been on air since 1925.",
    "The first-ever song to be performed live on MTV Unplugged was 'Rocket Man' by Elton John.",
    "The world's largest pipe organ is in the Boardwalk Hall Auditorium Organ in Atlantic City, with over 33,000 pipes.",
    "The longest continuous live performance by a full orchestra lasted 26 hours and 180 seconds.",
  ];

  return facts[Math.floor(Math.random() * facts.length)];
}
