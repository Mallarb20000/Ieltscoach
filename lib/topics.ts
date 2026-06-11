// Real IELTS Task 2 questions, mirrored from docs/samples/*.json prompts.
// Kept as plain strings so the client bundle does not include the essays.
export const TOPIC_BANK: string[] = [
  "Some of the methods used in advertising are unethical and unacceptable in today's society. To what extent do you agree with this view?",
  'Using a computer everyday can have more negative than positive effects on young children. Do you agree or disagree?',
  'A growing number of people feel that animals should not be exploited by people and that they should have the same rights as humans, while others argue that humans must employ animals to satisfy their various needs, including uses for food and research. Discuss both views and give your opinion.',
  'Some people believe that entertainers are paid too much and their impact on society is negative, while others disagree and believe that they deserve the money that they make because of their positive effects on society. Discuss both opinions and give your own opinion.',
  'Some people think that physical strength is important for success in sport, while others think that mental strength is more important. Discuss both views and give your own opinion.',
  'One of the consequences of improved medical care is that people are living longer and life expectancy is increasing. Do you think the advantages of this development outweigh the disadvantages?',
  'Young people are leaving their homes in rural areas to work or study in cities. What are the reasons? Do the advantages of this development outweigh the drawbacks?',
  'In some countries young people have little leisure time and are under a lot of pressure to work hard on their studies. What do you think are the causes of this? What solutions can you suggest?',
  'Some people believe that it is the responsibility of individuals to take care of their own health and diet. Others however believe that governments should make sure that their citizens have a healthy diet. Discuss both views and give your opinion.',
  'An increasing number of professionals, such as doctors and teachers, are leaving their own poorer countries to work in developed countries. What problems does this cause? What solutions can you suggest to deal with this situation?',
];

export function randomTopic(exclude?: string): string {
  const pool = exclude ? TOPIC_BANK.filter((t) => t !== exclude) : TOPIC_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}
