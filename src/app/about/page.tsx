import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About | Rep Finder',
  description: 'Why Rep Finder exists and how Congress forced the Epstein files into public view.',
};

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={styles.link}>
      {children}
    </a>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionNumber}>{number}</div>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

const timelineEntries: Array<{ year: string; active?: boolean; text: ReactNode }> = [
  {
    year: '1996',
    text: (
      <>
        <ExternalLink href="https://en.wikipedia.org/wiki/Maria_Farmer">Maria Farmer</ExternalLink> reported
        Epstein and Maxwell to the FBI. She told them about sexual assault, child trafficking, and child
        pornography. The agent{' '}
        <ExternalLink href="https://www.jamesmarshlaw.com/release-of-epstein-files-marks-milestone-for-survivors/">
          hung up on her
        </ExternalLink>
        . No investigation followed. The FBI Director was{' '}
        <ExternalLink href="https://www.fbi.gov/history/directors/louis-j-freeh">Louis Freeh</ExternalLink>.
        The AG was Janet Reno.
      </>
    ),
  },
  {
    year: '2005 - 2008',
    text: (
      <>
        Palm Beach police built a federal case. A prosecutor named{' '}
        <ExternalLink href="https://abcnews.com/US/key-takeaways-justice-department-review-jeffrey-epstein-sweetheart/story?id=74222922">
          Marie Villafana drafted a 60-count indictment
        </ExternalLink>{' '}
        backed by over 30 victims. The DOJ&apos;s child exploitation division called her work &quot;exhaustive.&quot;
        The indictment was never filed. Epstein&apos;s defense lawyers, who had{' '}
        <ExternalLink href="https://www.pbs.org/newshour/show/the-completely-unprecedented-plea-deal-jeffrey-epstein-made-with-alex-acosta">
          personal ties to the lead prosecutor
        </ExternalLink>
        , negotiated a{' '}
        <ExternalLink href="https://reason.com/wp-content/uploads/2021/08/Non-Prosecution-Agreement-1433.pdf">
          secret plea deal
        </ExternalLink>
        . He served 13 months. All co-conspirators received immunity. Victims were{' '}
        <ExternalLink href="https://www.npr.org/2020/11/12/934265386/jeffrey-epsteins-former-prosecutors-used-poor-judgment-in-deal-doj-says">
          never told
        </ExternalLink>
        .
      </>
    ),
  },
  {
    year: '2008',
    text: (
      <>
        Survivor <ExternalLink href="https://www.legalmomentum.org/newsletters/jeffrey-epstein-and-crime-victims-rights-act-cvra">Courtney Wild</ExternalLink>{' '}
        sued the federal government under the Crime Victims&apos; Rights Act. The case took 11 years. In 2019, a{' '}
        <ExternalLink href="https://epsteinislands.com/topics/epstein-legal-proceedings">judge ruled</ExternalLink>{' '}
        the plea deal had violated victims&apos; rights.
      </>
    ),
  },
  {
    year: '2008 - 2018',
    text: (
      <>
        The dead period. AGs <ExternalLink href="https://oversight.house.gov/release/oversight-committee-releases-acosta-transcript/">Eric Holder</ExternalLink>{' '}
        (6 years) and Loretta Lynch (2 years) opened no investigations. Congressional leadership on both sides
        discouraged action. The only people keeping this alive were survivors, their attorneys, and{' '}
        <ExternalLink href="https://en.wikipedia.org/wiki/Julie_K._Brown">Julie K. Brown</ExternalLink> at the
        Miami Herald.
      </>
    ),
  },
  {
    year: '2018',
    text: (
      <>
        Brown published <ExternalLink href="https://www.miamiherald.com/news/local/article220097825.html">&quot;Perversion of Justice&quot;</ExternalLink>,
        exposing the plea deal and identifying nearly 80 victims. Her reporting created the conditions for new
        charges.
      </>
    ),
  },
  {
    year: '2019',
    text: (
      <>
        Epstein was{' '}
        <ExternalLink href="https://www.justice.gov/usao-sdny/programs/victim-witness-services/united-states-v-jeffrey-epstein-19-cr-490-rmb">
          arrested on federal sex trafficking charges
        </ExternalLink>
        . One month later, he was found dead in his cell. No co-conspirators were charged. The Biden DOJ, under{' '}
        <ExternalLink href="https://thehill.com/opinion/criminal-justice/5740973-why-biden-didnt-release-the-epstein-files-but-maybe-should-have/">
          AG Merrick Garland
        </ExternalLink>
        , sat on the files for four years.
      </>
    ),
  },
  {
    year: 'January 2024',
    text: (
      <>
        A{' '}
        <ExternalLink href="https://www.cbsnews.com/news/jeffrey-epstein-list-names-released-unsealed-documents/">
          federal judge unsealed court documents
        </ExternalLink>{' '}
        from the Giuffre v. Maxwell lawsuit. Names hit headlines. Social media reignited public outrage. Trump{' '}
        <ExternalLink href="https://www.britannica.com/topic/The-Epstein-Files-A-Timeline">made the files a campaign promise</ExternalLink>.
      </>
    ),
  },
  {
    year: 'April 2025',
    text: (
      <>
        <ExternalLink href="https://www.pbs.org/newshour/politics/a-timeline-of-the-jeffrey-epstein-investigation-and-the-fight-to-make-the-governments-files-public">
          Virginia Giuffre died
        </ExternalLink>
        . One of the most prominent survivors, she fought publicly for years and never saw full accountability.
      </>
    ),
  },
  {
    year: 'July 2025',
    text: (
      <>
        AG Bondi announced{' '}
        <ExternalLink href="https://en.wikipedia.org/wiki/Epstein_Files_Transparency_Act">there was no client list</ExternalLink>{' '}
        and no more files would be released. Trump called Epstein{' '}
        <ExternalLink href="https://en.wikipedia.org/wiki/Epstein_Files_Transparency_Act">&quot;somebody that nobody cares about.&quot;</ExternalLink>{' '}
        The backlash was bipartisan and immediate. Khanna and Massie introduced the Transparency Act.
      </>
    ),
  },
  {
    year: 'November 2025 - Now',
    active: true,
    text: (
      <>
        The discharge petition{' '}
        <ExternalLink href="https://19thnews.org/2025/11/epstein-files-discharge-petition/">forced a vote</ExternalLink>.
        The law passed <ExternalLink href="https://clerk.house.gov/Votes/2025289">427 to 1</ExternalLink>. The DOJ{' '}
        <ExternalLink href="https://www.justice.gov/epstein/doj-disclosures">began releasing files</ExternalLink>{' '}
        but{' '}
        <ExternalLink href="https://www.cnbc.com/2026/03/17/epstein-pam-bondi-trump-doj-subpoena.html">
          remains in violation of the law
        </ExternalLink>
        . The <ExternalLink href="https://oversight.house.gov/">House Oversight Committee</ExternalLink> has
        subpoenaed Bondi, the Clintons, Wexner, Maxwell, and others.{' '}
        <ExternalLink href="https://time.com/article/2026/03/10/epstein-zorro-ranch-investigation-search-new-mexico/">
          New Mexico is searching Zorro Ranch
        </ExternalLink>
        . The fight for compliance is ongoing.
      </>
    ),
  },
];

const people: Array<{ name: string; href: string; role: string; text: ReactNode }> = [
  {
    name: 'Thomas Massie',
    href: 'https://massie.house.gov/',
    role: 'R-KY - Co-author, Epstein Files Transparency Act',
    text: (
      <>
        Filed the discharge petition that bypassed Speaker Johnson. Trump{' '}
        <ExternalLink href="https://time.com/7333573/epstein-files-discharge-petition-republicans-trump-massie-mace-boebert-greene/">
          backed a primary challenger against him
        </ExternalLink>
        . Massie won. He has{' '}
        <ExternalLink href="https://www.pbs.org/newshour/classroom/daily-news-lessons/2026/02/epstein-files-scrubbed-to-protect-elite-powerful-men-rep-ro-khanna-says">
          publicly confronted AG Bondi
        </ExternalLink>{' '}
        and is pushing for{' '}
        <ExternalLink href="https://abcnews.com/Politics/lawmakers-threaten-legal-action-bondi-doj-partial-release/story?id=128618210">
          inherent contempt proceedings
        </ExternalLink>
        .
      </>
    ),
  },
  {
    name: 'Ro Khanna',
    href: 'https://khanna.house.gov/',
    role: 'D-CA - Author, Epstein Files Transparency Act',
    text: (
      <>
        Reviewed unredacted files and{' '}
        <ExternalLink href="https://www.pbs.org/newshour/show/epstein-files-scrubbed-to-protect-elite-powerful-men-rep-khanna-says">
          went to the House floor to read the names
        </ExternalLink>{' '}
        of six powerful individuals whose identities had been improperly redacted. Defied the Clintons and
        senior Democratic leadership.
      </>
    ),
  },
  {
    name: 'Nancy Mace',
    href: 'https://mace.house.gov/',
    role: 'R-SC - Oversight Committee, discharge petition signer',
    text: (
      <>
        Signed the petition under{' '}
        <ExternalLink href="https://www.newsweek.com/epstein-files-nancy-mace-trump-discharge-petition-11038346">
          direct White House pressure
        </ExternalLink>
        . A survivor of sexual assault, she{' '}
        <ExternalLink href="https://mace.house.gov/media/press-releases/house-oversight-committee-passes-two-rep-nancy-maces-subpoenas">
          offered the bipartisan subpoena of AG Bondi
        </ExternalLink>{' '}
        and has{' '}
        <ExternalLink href="https://thehill.com/homenews/house/5752547-nancy-mace-epstein-files-doj-records/">
          pressed for terabytes of withheld files
        </ExternalLink>
        .
      </>
    ),
  },
  {
    name: 'Melanie Stansbury',
    href: 'https://stansbury.house.gov/',
    role: 'D-NM - Leading the Zorro Ranch investigation',
    text: (
      <>
        Pushed for investigation of Epstein&apos;s{' '}
        <ExternalLink href="https://time.com/article/2026/03/10/epstein-zorro-ranch-investigation-search-new-mexico/">
          7,600-acre New Mexico ranch
        </ExternalLink>
        , a property the FBI never searched despite decades of abuse allegations. Reviewed unredacted files.
        Helped launch a{' '}
        <ExternalLink href="https://time.com/7379228/epstein-zorro-ranch-investigation/">bipartisan truth commission</ExternalLink>.
      </>
    ),
  },
];

export default function AboutPage() {
  return (
    <main className={`startup-shell ${styles.pageShell}`}>
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroLabel}>Rep Finder</div>
          <h1>The DOJ is not doing its job. It is up to Congress. It is up to you.</h1>
          <p className={styles.heroSub}>
            For nearly 30 years, the U.S. government has had evidence of a sex trafficking operation that
            abused girls and women. It has had the names. It has had the files. And at every turn, the
            institutions responsible for justice have chosen to protect the powerful instead of the vulnerable.
          </p>
        </header>

        <Section number="01 - Congress stepped up" title="The files got released because Congress forced it">
          <p>In late 2025, the DOJ began releasing millions of documents related to Jeffrey Epstein. This was not voluntary. It happened because Congress passed a law.</p>
          <p>
            The <span className={styles.emAccent}>Epstein Files Transparency Act</span> requires the Attorney
            General to publicly release all unclassified records related to Epstein and Ghislaine Maxwell held by
            the DOJ, the FBI, and U.S. Attorneys&apos; Offices. Investigation records. Flight logs. Internal
            communications. Immunity deals. Plea agreements. The names of every government official and
            politically exposed person connected to Epstein&apos;s crimes. The AG was given 30 days to comply. An
            unredacted list of names must be provided to the{' '}
            <ExternalLink href="https://www.congress.gov/bill/119th-congress/house-bill/4405/text">
              House and Senate Judiciary Committees
            </ExternalLink>
            .
          </p>
          <p>
            The bill was authored by{' '}
            <ExternalLink href="https://khanna.house.gov/media/press-releases/rep-khannas-statement-third-federal-judge-granting-request-unseal-files-ahead">
              Rep. Ro Khanna
            </ExternalLink>{' '}
            and co-sponsored by <ExternalLink href="https://massie.house.gov/">Rep. Thomas Massie</ExternalLink>.
            It passed the <ExternalLink href="https://clerk.house.gov/Votes/2025289">House 427 to 1</ExternalLink>.
            The{' '}
            <ExternalLink href="https://thehill.com/homenews/senate/5611756-senate-epstein-files-bill/">
              Senate passed it unanimously
            </ExternalLink>{' '}
            the same day. The President signed it into law on{' '}
            <ExternalLink href="https://www.britannica.com/topic/What-Is-the-Epstein-Files-Transparency-Act">
              November 19, 2025
            </ExternalLink>
            .
          </p>
          <div className={styles.lawLine}>
            <strong>This is a law. Not adhering to it is a crime.</strong> The DOJ{' '}
            <ExternalLink href="https://www.cbsnews.com/live-updates/epstein-files-vote-2025/">missed its legal deadline</ExternalLink>,
            released files with{' '}
            <ExternalLink href="https://en.wikipedia.org/wiki/Epstein_Files_Transparency_Act">unauthorized redactions</ExternalLink>,
            and is still withholding roughly half of the estimated 6 million responsive pages. As of March 2026,
            the DOJ is in violation of the law it is supposed to enforce.
          </div>
        </Section>

        <Section number="02 - The procedural fight" title="The discharge petition made it possible">
          <p>
            The Transparency Act almost never happened.{' '}
            <ExternalLink href="https://www.cbsnews.com/live-updates/epstein-files-vote-2025/">
              House Speaker Mike Johnson blocked it
            </ExternalLink>{' '}
            from reaching a vote for months. He sent members home early. He called it &quot;reckless.&quot;
          </p>
          <p>
            A discharge petition is a procedural tool in the House. If 218 members sign it, a bill goes to the
            floor no matter what leadership wants. It is rarely used. It exists for exactly this kind of moment.
          </p>
          <p>
            Massie filed the petition in September 2025. Every Democrat signed on. But they needed at least six
            Republicans to cross party lines. The{' '}
            <ExternalLink href="https://www.axios.com/2025/11/12/epstein-files-trump-massie-discharge-petition-boebert-mace">
              White House pressured signers to remove their names
            </ExternalLink>
            . Lauren Boebert was brought into the Situation Room to be talked out of it. She didn&apos;t budge.
            <ExternalLink href="https://www.npr.org/2025/11/18/nx-s1-5611438/epstein-files-bill-house-vote">
              {' '}Marjorie Taylor Greene signed knowing Trump would call her a traitor
            </ExternalLink>
            . He did. She signed anyway.
          </p>
          <p>
            On November 12, with the{' '}
            <ExternalLink href="https://www.nbcnews.com/politics/congress/bipartisan-duo-expects-signatures-wednesday-force-vote-release-epstein-rcna231405">
              swearing-in of a new member
            </ExternalLink>
            , the petition hit 218. Six days later, the House voted 427 to 1. The only &quot;no&quot; was{' '}
            <ExternalLink href="https://www.britannica.com/question/Did-Congress-vote-to-release-the-Epstein-files">
              Rep. Clay Higgins of Louisiana
            </ExternalLink>
            .
          </p>
          <div className={styles.factLine}>
            <strong>Without the discharge petition, there is no vote.</strong> Without the vote, there is no law.
            Without the law, the DOJ releases nothing. Every investigation and subpoena that has followed traces
            back to this moment.
          </div>
        </Section>

        <Section number="03 - The obstruction" title="There are people actively blocking this">
          <p>
            The law passed near-unanimously. But compliance is the fight now.{' '}
            <ExternalLink href="https://www.axios.com/2026/03/05/pam-bondi-impeach-democrat-epstein-files-doj-ag">
              AG Pam Bondi
            </ExternalLink>{' '}
            missed the legal deadline, authorized redactions the law does not permit, and has{' '}
            <ExternalLink href="https://www.axios.com/2026/03/19/pam-bondi-impeach-epstein-democrats-briefing">
              refused to commit to complying with a congressional subpoena
            </ExternalLink>
            . Two members of Congress have filed{' '}
            <ExternalLink href="https://summerlee.house.gov/newsroom/press-releases/rep-summer-lee-introduces-articles-of-impeachment-against-attorney-general-pam-bondi">
              articles of impeachment
            </ExternalLink>{' '}
            against her.
          </p>
          <p>
            But it is not just the DOJ. Congressional leadership on both sides spent months trying to prevent this
            law from existing. Even now, many members who voted yes have done nothing since to push for enforcement.
          </p>
          <p>Some of these people represent you.</p>
        </Section>

        <Section number="04 - Your power" title="Primaries are coming. Every seat is on the table.">
          <p>
            Every member of the House is up for election in 2026. So are a third of Senators. Primary elections
            are where the real decisions get made. If your representative voted yes but has done nothing to enforce
            it, they are counting on you not to notice.
          </p>
          <div className={styles.ctaList}>
            <div className={styles.ctaItem}>
              <div className={styles.ctaLabel}>Look them up</div>
              <div className={styles.ctaDesc}>
                Rep Finder scores every representative on the power they hold and how they are using it. Committee
                seats. Votes. Statements. Subpoenas. Silence.
              </div>
            </div>
            <div className={styles.ctaItem}>
              <div className={styles.ctaLabel}>Contact them</div>
              <div className={styles.ctaDesc}>
                Phone, email, mail, social media, website. Tell them you are watching.
              </div>
            </div>
            <div className={styles.ctaItem}>
              <div className={styles.ctaLabel}>Vote</div>
              <div className={styles.ctaDesc}>
                We show you if your representative is up for re-election and link you to voter registration in
                your state.
              </div>
            </div>
            <div className={styles.ctaItem}>
              <div className={styles.ctaLabel}>Run</div>
              <div className={styles.ctaDesc}>
                If the people who represent you are part of the problem, you do not have to wait for someone else.
                Every one of these seats belongs to the public.
              </div>
            </div>
          </div>
        </Section>

        <Section number="05 - The history" title="This is not new">
          <p>
            The public attention may feel recent. It is not. This fight goes back decades, carried almost entirely
            by survivors and a handful of people who refused to let it die.
          </p>
          <div className={styles.timeline}>
            {timelineEntries.map((entry) => (
              <div
                key={entry.year}
                className={`${styles.timelineEntry}${entry.active ? ` ${styles.timelineEntryActive}` : ''}`}
              >
                <div className={styles.timelineYear}>{entry.year}</div>
                <div className={styles.timelineText}>{entry.text}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section number="06 - Both sides" title="This is bipartisan">
          <p>This is not a left vs. right issue. The obstruction has come from both parties. So has the fight against it.</p>
          <p>
            The <ExternalLink href="https://www.nbcnews.com/politics/congress/clintons-scheduled-give-house-oversight-testimony-rcna259822">Clintons</ExternalLink>{' '}
            actively lobbied members of Congress to prevent the release.{' '}
            <ExternalLink href="https://www.pbs.org/video/clip1-ol49qk/">Nancy Pelosi admonished younger Democrats</ExternalLink>{' '}
            behind closed doors for considering holding the Clintons accountable.{' '}
            <ExternalLink href="https://www.pbs.org/video/clip1-ol49qk/">Democratic leadership told rank and file not to pursue this</ExternalLink>,
            partly out of concern about donors.
          </p>
          <p>
            <ExternalLink href="https://en.wikipedia.org/wiki/Epstein_Files_Transparency_Act">
              Trump called the files a &quot;Democrat hoax&quot;
            </ExternalLink>
            , opposed the Act until it was clear it would pass, and his DOJ is now in violation of the law he
            signed. His{' '}
            <ExternalLink href="https://www.axios.com/2025/11/12/epstein-files-trump-massie-discharge-petition-boebert-mace">
              White House pressured members
            </ExternalLink>{' '}
            to pull their names from the discharge petition.
          </p>
          <p>Both sides had reasons to bury this. Both sides tried. The people who broke through did so against their own leadership.</p>

          <div className={styles.peopleList}>
            {people.map((person) => (
              <div key={person.name} className={styles.person}>
                <div className={styles.personName}>
                  <a href={person.href} className={styles.personLink}>
                    {person.name}
                  </a>
                </div>
                <div className={styles.personRole}>{person.role}</div>
                <div className={styles.personText}>{person.text}</div>
              </div>
            ))}
          </div>

          <p className={styles.peopleClosing}>
            These four come from different parties, different states, and different ideologies. What they share is
            a willingness to act when it costs them something. That is what your representative should be doing.
          </p>
        </Section>

        <div className={styles.closing}>
          <p>
            The survivors carried this fight for 30 years.{' '}
            <ExternalLink href="https://en.wikipedia.org/wiki/Maria_Farmer">Maria Farmer</ExternalLink>.{' '}
            <ExternalLink href="https://www.legalmomentum.org/newsletters/jeffrey-epstein-and-crime-victims-rights-act-cvra">
              Courtney Wild
            </ExternalLink>
            . Annie Farmer. Virginia Giuffre. Jena-Lisa Jones. Rachel Benavidez. And hundreds more whose names we
            may never know.
          </p>
          <p className={styles.closingLead}>
            The least we can do is pay attention to who is fighting now and who is not.
          </p>
        </div>
      </div>
    </main>
  );
}
