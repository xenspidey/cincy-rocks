import { FESTIVAL } from '../config';
import { store } from '../data/store';
import { useLoad } from '../data/hooks';
import { dateRangeLabel } from '../data/format';
import { Icon } from '../components/Art';
import { Loading } from '../components/ShowRow';

const faq = [
  ['Do I need a ticket?', 'No. Every show is free and open to everyone.'],
  ['Are shows all ages?', 'Most are. Brewery and late-night club shows may be 21+; check the venue page.'],
  ['Can I bring a chair?', 'Yes, at outdoor stages. Indoor venues have limited seating.'],
  ['How do I get around?', 'Most venues are in Over-the-Rhine and downtown, a short walk or streetcar ride apart.'],
];

export default function Info() {
  const { data } = useLoad(() => store.listNews());
  return (
    <div className="page">
      <h1 className="page-title">News & Info</h1>
      <section className="card">
        <h2>News</h2>
        {!data ? <Loading /> : data.length === 0 ? <p className="muted">No news yet.</p> : data.map((n) => (
          <article key={n.id} className="news">
            <time>{new Date(n.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
            <h3>{n.title}</h3>
            <p>{n.body}</p>
          </article>
        ))}
      </section>
      <section className="card">
        <h2>About {FESTIVAL.name}</h2>
        <p>{FESTIVAL.name} brings together live music across {FESTIVAL.town}, {dateRangeLabel()}. Wander between cafés, parks, breweries and clubs, and find your new favourite band.</p>
      </section>
      <section className="card">
        <h2>Good to know</h2>
        {faq.map(([q, a]) => (
          <details key={q} className="faq">
            <summary>{q}<Icon name="chevron-down" /></summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <section className="card">
        <h2>Contact</h2>
        <a className="btn btn-outline" href={`mailto:${FESTIVAL.contactEmail}`}><Icon name="envelope" /> {FESTIVAL.contactEmail}</a>
      </section>
    </div>
  );
}
