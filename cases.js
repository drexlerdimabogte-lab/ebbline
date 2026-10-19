// Gallery data + case-study overlay (native <dialog>: focus trap, Esc to close, focus restore).
// Vessel names, specs and stories are fictional; photos are free-licence stand-ins of real vessels by other designers.
const C = (by, lic, licUrl, page) => ({ by, lic, licUrl, page });
export const PROJECTS = [
  { id: 'lumen-42', name: 'Lumen 42', place: 'Lake Geneva · 2025', type: 'Passenger ferry', img: 'p1',
    lede: 'A battery-electric lake ferry that docks without a sound and recharges in the eleven minutes it spends at the pier.',
    specs: [['Length overall', '42.0 m'], ['Beam', '8.6 m'], ['Draught', '1.9 m'], ['Passengers', '320'], ['Propulsion', 'Battery-electric, 2 × 400 kW pods'], ['Service speed', '12 kn'], ['Hull', 'Marine aluminium']],
    story: ['The brief asked for a ferry that would feel at home next to a century of lake steamers, yet run on shore power alone. We kept the long, low sheer of the old ships and hid 1.4 MWh of batteries in the double bottom, where their weight lowers the centre of gravity.',
      'The waterlines were faired over nine tank runs to cut the wake at 12 knots, so the ferry can hold speed close to the reed beds without disturbing them. Inside, one open saloon with oak benches replaces the usual split between classes.'],
    role: ['Naval architecture', 'General arrangement', 'Interiors'], credit: C('Christian David', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:CGN_ship_G%C3%A9n%C3%A9ral-Guisan_moored_at_Yvoire,_Haute-Savoie.jpg') },
  { id: 'fyr-38', name: 'Fyr 38', place: 'North Sea · 2024', type: 'Buoy tender', img: 'p2',
    lede: 'A short, beamy workboat built to lift twelve-tonne buoys in a steep North Sea chop and still give the crew a steady deck.',
    specs: [['Length overall', '38.2 m'], ['Beam', '9.4 m'], ['Draught', '2.6 m'], ['Deck crane', '12 t at 10 m'], ['Propulsion', 'Diesel-electric hybrid, 2 × 750 kW'], ['Service speed', '11 kn'], ['Hull', 'Steel, ice-strengthened']],
    story: ['Buoy work is a stability problem first: a heavy load swinging over the side of a small hull. We widened the beam, moved the crane forward of midships and added passive anti-roll tanks, so the vessel heels less than four degrees at full outreach.',
      'The hybrid drivetrain lets the tender hold station on batteries alone while the crane works, which keeps the deck quiet and the exhaust away from the crew.'],
    role: ['Naval architecture', 'Stability', 'Structure'], credit: C('Dietmar Rabich', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Norderney,_Tonnenleger_%22Norden%22_--_2025_--_9137.jpg') },
  { id: 'kestrel', name: 'Kestrel', place: 'Mediterranean · 2023', type: 'Naval hull study', img: 'p3',
    lede: 'A research study into a slender hull form for long, fuel-limited patrols at moderate speed.',
    specs: [['Length (study)', '142 m'], ['Beam', '20.0 m'], ['Displacement', '≈ 6,000 t'], ['Tank runs', '38'], ['Design speed', '27 kn'], ['Deliverable', 'Hull form + resistance report']],
    story: ['Kestrel never left the drawing office. It is a set of lines, a resistance curve and a stack of tank-test photographs, and it is still one of the projects we refer back to most often.',
      'We compared three bow forms and two stern wedges across the speed range and found a 9% saving at patrol speed against the reference hull, at the cost of a slightly wetter foredeck in head seas.'],
    role: ['Hull form research', 'Tank testing'], credit: C('Christian Ferrer', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/', 'https://commons.wikimedia.org/wiki/File:Languedoc_(fr%C3%A9gate),_S%C3%A8te.jpg') },
  { id: 'polar-95', name: 'Polar 95', place: 'Southern Ocean · 2022', type: 'Expedition icebreaker', img: 'p4',
    lede: 'An expedition and supply icebreaker that carries scientists, cargo and helicopters through first-year ice.',
    specs: [['Length overall', '95.0 m'], ['Beam', '20.3 m'], ['Draught', '7.9 m'], ['Ice class', 'PC 4 (design)'], ['Berths', '116'], ['Endurance', '60 days'], ['Propulsion', 'Diesel-electric, 4 × 2.8 MW']],
    story: ['A polar ship has two jobs that pull in opposite directions: it must break ice, and it must be bearable to live on for two months in the Southern Ocean. The bow is a spoon form for breaking ice; the aft body is fuller and quieter for station keeping.',
      'Accommodation sits amidships, where motion is lowest, and every cabin has a window. The hull is shaded orange-red so it can be seen against the ice, a colour we kept on the drawings from the first sketch.'],
    role: ['Naval architecture', 'General arrangement', 'Ice performance'], credit: C('Edoddridge', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', 'https://commons.wikimedia.org/wiki/File:Aurora_Australis_(icebreaker)_berthed_in_Hobart_under_a_rainbow.jpg') },
  { id: 'thames-24', name: 'Thames 24', place: 'London · 2021', type: 'River cruiser', img: 'p5',
    lede: 'A low-air-draught river cruiser sized to pass every bridge on the tidal Thames at high water.',
    specs: [['Length overall', '24.0 m'], ['Beam', '5.2 m'], ['Air draught', '4.1 m'], ['Passengers', '80'], ['Propulsion', 'Hybrid, electric in the city centre'], ['Service speed', '8 kn']],
    story: ['On a tidal river the bridges set the design. We drew the profile around a 4.1 metre air draught, then lowered the saloon floor below the waterline to keep standing headroom inside.',
      'The hull runs on electric power through central London and switches to its generator only on the open reaches downstream.'],
    role: ['Yacht design', 'Interiors'], credit: C('Mike Peel (mikepeel.net)', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:At_London_2025_556_-_Avontuur_IV_on_the_River_Thames.jpg') },
  { id: 'bodan-60', name: 'Bodan 60', place: 'Lake Constance · 2020', type: 'Heritage motor ship', img: 'p6',
    lede: 'A refit study for a classic lake motor ship: keep the silhouette, replace everything below the waterline.',
    specs: [['Length overall', '60.0 m'], ['Beam', '9.8 m'], ['Passengers', '600'], ['Scope', 'Survey, repower, interiors'], ['Fuel saving', '≈ 30% (projected)']],
    story: ['Heritage ships are loved for their lines, so the refit had to be invisible from the quay. We surveyed the hull, kept the original frames and planned a hybrid drivetrain that fits the existing engine room.',
      'Inside, later partitions come out and the original long saloon returns, with new lighting tucked into the deck beams.'],
    role: ['Refit & repower', 'Interiors'], credit: C('Julian Herzog', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/', 'https://commons.wikimedia.org/wiki/File:Lindau_Harbor_Lake_Constance_MS_Schwaben_01.jpg') },
];

export const picture = (base, alt, w1, w2, sizes, eager = false, cls = '', W = 1200, H = 900) =>
  `<picture><source type="image/avif" srcset="img/${base}-${w1}.avif ${w1}w, img/${base}-${w2}.avif ${w2}w" sizes="${sizes}">` +
  `<source type="image/webp" srcset="img/${base}-${w1}.webp ${w1}w, img/${base}-${w2}.webp ${w2}w" sizes="${sizes}">` +
  `<img${cls ? ` class="${cls}"` : ''} src="img/${base}.jpg" alt="${alt}" width="${W}" height="${H}" ${eager ? '' : 'loading="lazy" '}decoding="async"></picture>`;

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
export function setupCases(lenis) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dlg = document.getElementById('case'), body = dlg.querySelector('.case-body');
  let idx = -1, opener = null, busy = false;
  const fill = i => { const p = PROJECTS[i]; const n = PROJECTS.length;
    body.innerHTML = `<div class="case-media">${picture(p.img, `${p.type}, stand-in photo`, 600, 1200, '(max-width: 900px) 100vw, 50vw', true)}</div>
      <div class="case-text">
        <p class="mono kicker">[0${i + 1}] ${esc(p.type)} — ${esc(p.place)}</p>
        <h2 class="h2" id="caseTitle">${esc(p.name)}</h2>
        <p class="case-lede">${esc(p.lede)}</p>
        <h3 class="mono case-h">Specifications</h3>
        <dl class="case-specs">${p.specs.map(([k, v]) => `<div><dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <h3 class="mono case-h">Story</h3>
        ${p.story.map(s => `<p class="case-p">${esc(s)}</p>`).join('')}
        <h3 class="mono case-h">Ebbline scope</h3>
        <ul class="chips mono case-role">${p.role.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
        <div class="case-credit mono"><p>Photo: <a href="${p.credit.page}" target="_blank" rel="noopener">${esc(p.credit.by)}</a> · <a href="${p.credit.licUrl}" target="_blank" rel="noopener">${p.credit.lic}</a>, via Wikimedia Commons (cropped/resized).</p>
          <p>The photo shows a real vessel by another designer or yard, used as a stand-in. Name, specifications and story are fictional.</p></div>
        <nav class="case-nav mono" aria-label="More vessels">
          <button type="button" class="case-prev" data-go="${(i + n - 1) % n}">← ${esc(PROJECTS[(i + n - 1) % n].name)}</button>
          <button type="button" class="case-next" data-go="${(i + 1) % n}">${esc(PROJECTS[(i + 1) % n].name)} →</button></nav>
      </div>`;
    dlg.scrollTop = 0; idx = i; history.replaceState(null, '', '#case-' + p.id); };
  const open = (i, from) => { if (busy) return; opener = from || document.activeElement; fill(i);
    lenis.stop(); document.documentElement.classList.add('case-open'); dlg.showModal();
    if (!reduced) { busy = true; gsap.fromTo(dlg, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: .9, ease: 'expo.inOut', onComplete: () => busy = false });
      gsap.fromTo(body.querySelector('.case-media img'), { scale: 1.15 }, { scale: 1, duration: 1.4, ease: 'expo.out' });
      gsap.from(body.querySelectorAll('.case-text > *'), { y: 24, autoAlpha: 0, duration: .8, stagger: .04, delay: .35, ease: 'power3.out' }); }
    else gsap.set(dlg, { clipPath: 'none' }); };
  const finish = () => { dlg.close(); document.documentElement.classList.remove('case-open'); lenis.start();
    history.replaceState(null, '', location.pathname + location.search); busy = false; if (opener && opener.focus) opener.focus({ preventScroll: true }); };
  const close = () => { if (busy || !dlg.open) return; if (reduced) return finish(); busy = true;
    gsap.to(dlg, { clipPath: 'inset(0 0 100% 0)', duration: .7, ease: 'expo.inOut', onComplete: finish }); };
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });                    // Esc
  dlg.querySelector('.case-close').addEventListener('click', close);
  dlg.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (!b) return; fill(+b.dataset.go);
    if (!reduced) gsap.from(body.children, { autoAlpha: 0, y: 16, duration: .6, stagger: .06 });
    body.querySelector(b.classList.contains('case-next') ? '.case-next' : '.case-prev').focus(); });
  document.querySelectorAll('[data-case]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(+a.dataset.case, a); }));
  const m = location.hash.match(/^#case-(.+)$/); if (m) { const i = PROJECTS.findIndex(p => p.id === m[1]); if (i >= 0) open(i, document.querySelector(`[data-case="${i}"]`)); }
}
