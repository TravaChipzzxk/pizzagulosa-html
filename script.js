"use strict";
/* --- Configuração --- */
const WHATSAPP = "55+ (19) 979276076";   // DDI + DDD + número
const TAXA_ENTREGA = 6;
const TAMANHOS = { broto: "Broto", media: "Média", grande: "Grande", família: "Família"};
const FATIAS = { broto: "4 fatias", media: "6 fatias", grande: "8 fatias", família: "12 fatias" };
const DIAS = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const HORARIOS = { 0:["17:30","23:30"], 1:null, 2:["17:00","23:30"], 3:["17:00","23:30"], 4:["17:00","23:30"], 5:["18:00","23:30"], 6:["18:00","23:30"] };

/* --- Dados --- */
const CATEGORIAS = ["Todas","Tradicionais","Especiais","Doces"];
const PIZZAS = [
 {id:1, nome:"Margherita", cat:"Tradicionais", ing:"Molho de tomate, muçarela de búfala, manjericão fresco e azeite", p:{broto:32,media:52,grande:68,família:76}},
 {id:2, nome:"Calabresa", cat:"Tradicionais", ing:"Muçarela, calabresa artesanal fatiada e cebola roxa", p:{broto:30,media:48,grande:62,família:70}},
 {id:3, nome:"Portuguesa", cat:"Tradicionais", ing:"Muçarela, presunto, ovo, cebola, ervilha e azeitonas", p:{broto:32,media:52,grande:66,família:74}},
 {id:4, nome:"Quatro Queijos", cat:"Tradicionais", ing:"Muçarela, provolone, gorgonzola e parmesão", p:{broto:34,media:56,grande:72,família:80}},
 {id:5, nome:"Frango com Catupiry", cat:"Tradicionais", ing:"Frango desfiado temperado, catupiry original e milho", p:{broto:32,media:52,grande:67,família:75}},
 {id:6, nome:"São Bento", cat:"Especiais", ing:"Muçarela, linguiça de fumeiro, cogumelos, cebola caramelizada e rúcula", p:{broto:38,media:62,grande:82,família:90}},
 {id:7, nome:"Burrata e Pesto", cat:"Especiais", ing:"Molho de tomate, burrata, pesto de manjericão e tomate confit", p:{broto:42,media:68,grande:90,família:98}},
 {id:8, nome:"Parma e Figo", cat:"Especiais", ing:"Muçarela, presunto cru, figo, mel e nozes", p:{broto:44,media:72,grande:94,família:105}},
 {id:9, nome:"Carne Seca", cat:"Especiais", ing:"Carne seca desfiada, abóbora assada, catupiry e cebolinha", p:{broto:40,media:64,grande:84,família:89}},
 {id:10, nome:"Chocolate com Morango", cat:"Doces", ing:"Chocolate ao leite, morangos frescos e raspas de chocolate branco", p:{broto:34,media:54,grande:70,família:78}},
 {id:11, nome:"Banana com Canela", cat:"Doces", ing:"Muçarela, banana, açúcar, canela e leite condensado", p:{broto:30,media:48,grande:62,família:74}},
 {id:12, nome:"Romeu e Julieta", cat:"Doces", ing:"Muçarela e goiabada cremosa", p:{broto:30,media:46,grande:60,família:72}}
];

/* --- Estado (carrinho salvo no navegador) --- */
const estado = { cat:"Todas", busca:"", tam:{}, carrinho:[] };
try { estado.carrinho = JSON.parse(localStorage.getItem("fsb-carrinho")) || []; } catch(e) {}
const salvar = () => { try { localStorage.setItem("fsb-carrinho", JSON.stringify(estado.carrinho)); } catch(e) {} };

/* --- Utilidades --- */
const $ = (s, r = document) => r.querySelector(s);
const moeda = (v) => v.toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
const norm = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const pizza = (id) => PIZZAS.find((x) => x.id === id);
const tamanho = (id) => estado.tam[id] || "media";
const tipoPedido = () => $('input[name="tipo"]:checked').value;
function avisar(texto) {
  const t = $("#toast"); t.textContent = texto; t.classList.add("on");
  clearTimeout(avisar.id); avisar.id = setTimeout(() => t.classList.remove("on"), 1800);
}

/* --- Status e horários (Date) --- */
const min = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const fmt = (h) => h.replace(":00", "h").replace(":", "h");
function atualizarStatus() {
  const d = new Date(), hoje = HORARIOS[d.getDay()], agora = d.getHours() * 60 + d.getMinutes();
  const aberto = !!hoje && agora >= min(hoje[0]) && agora < min(hoje[1]);
  let txt = "Fechado no momento";
  if (aberto) txt = `Aberto agora · fecha às ${fmt(hoje[1])}`;
  else if (hoje && agora < min(hoje[0])) txt = `Fechado no momento · abre hoje às ${fmt(hoje[0])}`;
  const s = $("#status"); s.textContent = txt; s.classList.toggle("aberto", aberto);
  $("#status-mobile").textContent = txt;
}
function renderHorarios() {
  const hoje = new Date().getDay();
  $("#horarios").innerHTML = DIAS.map((nome, i) => {
    const h = HORARIOS[i];
    return `<tr class="${i === hoje ? "hoje" : ""}"><th scope="row">${nome}${i === hoje ? " (hoje)" : ""}</th><td>${h ? `${fmt(h[0])} às ${fmt(h[1])}` : "Fechado"}</td></tr>`;
  }).join("");
}

/* --- Cardápio --- */
function renderAbas() {
  $("#abas").innerHTML = CATEGORIAS.map((c) => `<button type="button" class="aba" data-cat="${c}" aria-pressed="${c === estado.cat}">${c}</button>`).join("");
}
function filtradas() {
  const q = norm(estado.busca.trim());
  return PIZZAS.filter((x) => (estado.cat === "Todas" || x.cat === estado.cat) && (!q || norm(x.nome + " " + x.ing).includes(q)));
}
function htmlPrato(x) {
  const at = tamanho(x.id);
  const radios = Object.keys(TAMANHOS).map((t) => `<label><input type="radio" name="t${x.id}" value="${t}" data-id="${x.id}" ${t === at ? "checked" : ""}><span>${TAMANHOS[t]}<small>${FATIAS[t]}</small></span></label>`).join("");
  return `<article class="prato">
    <div><h3>${x.nome}</h3><p>${x.ing}</p><span class="tag">${x.cat}</span></div>
    <div>
      <fieldset class="tam"><legend class="sr">Tamanho de ${x.nome}</legend>${radios}</fieldset>
      <div class="compra" style="margin-top:.8rem"><span class="preco" data-preco="${x.id}" aria-live="polite">${moeda(x.p[at])}</span><button type="button" class="btn btn-forno" data-add="${x.id}">Adicionar</button></div>
    </div></article>`;
}
function renderLista() {
  const l = filtradas();
  $("#lista").innerHTML = l.length ? l.map(htmlPrato).join("") : `<p class="vazio">Nenhuma pizza encontrada. Tente outro nome, ingrediente ou categoria.</p>`;
}

/* --- Carrinho --- */
const subtotal = () => estado.carrinho.reduce((s, i) => s + pizza(i.id).p[i.t] * i.q, 0);
const taxa = () => (estado.carrinho.length && tipoPedido() === "entrega" ? TAXA_ENTREGA : 0);

function adicionar(id) {
  const t = tamanho(id), ex = estado.carrinho.find((i) => i.id === id && i.t === t);
  ex ? ex.q++ : estado.carrinho.push({id, t, q:1});
  renderCarrinho(); avisar(`${pizza(id).nome} (${TAMANHOS[t]}) adicionada`);
}
function mudar(id, t, delta) {
  const i = estado.carrinho.find((x) => x.id === id && x.t === t);
  if (!i) return;
  i.q += delta;
  if (i.q <= 0) remover(id, t); else renderCarrinho();
}
function remover(id, t) {
  estado.carrinho = estado.carrinho.filter((i) => !(i.id === id && i.t === t));
  renderCarrinho();
}
function renderCarrinho() {
  const n = estado.carrinho.reduce((s, i) => s + i.q, 0);
  $("#itens").innerHTML = estado.carrinho.length ? estado.carrinho.map((i) => {
    const p = pizza(i.id), k = `${i.id}|${i.t}`;
    return `<li class="item"><div><strong>${p.nome}</strong><small>${TAMANHOS[i.t]} · ${moeda(p.p[i.t])} cada</small></div><span class="v">${moeda(p.p[i.t] * i.q)}</span>
      <div class="ac"><div class="qtd"><button type="button" data-menos="${k}" aria-label="Diminuir ${p.nome}">−</button><output>${i.q}</output><button type="button" data-mais="${k}" aria-label="Aumentar ${p.nome}">+</button></div>
      <button type="button" class="rem" data-rem="${k}" aria-label="Remover ${p.nome}">Remover</button></div></li>`;
  }).join("") : `<li class="vazio">Seu pedido está vazio. Escolha uma pizza no cardápio.</li>`;
  $("#subtotal").textContent = moeda(subtotal());
  $("#taxa").textContent = tipoPedido() === "entrega" ? moeda(taxa()) : "Grátis";
  $("#total").textContent = moeda(subtotal() + taxa());
  $("#contador").textContent = n;
  $("#enviar").disabled = !n;
  salvar();
}

/* --- Gaveta --- */
function gaveta(abrir) {
  document.body.classList.toggle("aberto", abrir);
  $("#abrir").setAttribute("aria-expanded", abrir);
  if (abrir) $("#fechar").focus(); else $("#abrir").focus();
}

/* --- Checkout --- */
function validar() {
  let ok = true;
  const regras = [["#c-nome", $("#nome").value.trim().length >= 2, "Informe seu nome."],
                  ["#c-end", tipoPedido() === "retirada" || $("#endereco").value.trim().length >= 6, "Informe rua, número e bairro."]];
  regras.forEach(([sel, valido, msg]) => {
    const c = $(sel); c.classList.toggle("erro", !valido);
    $(".msg-erro", c).textContent = valido ? "" : msg;
    if (!valido && ok) { c.querySelector("input").focus(); ok = false; }
  });
  return ok;
}
function enviar() {
  if (!estado.carrinho.length || !validar()) return;
  const linhas = estado.carrinho.map((i) => `• ${i.q}x ${pizza(i.id).nome} (${TAMANHOS[i.t]}) - ${moeda(pizza(i.id).p[i.t] * i.q)}`);
  const entrega = tipoPedido() === "entrega";
  const msg = [
    "Olá, Forneria São Bento! Quero fazer um pedido:", "",
    ...linhas, "",
    `Subtotal: ${moeda(subtotal())}`,
    entrega ? `Entrega: ${moeda(TAXA_ENTREGA)}` : "Retirada no balcão",
    `*Total: ${moeda(subtotal() + taxa())}*`, "",
    `Nome: ${$("#nome").value.trim()}`,
    entrega ? `Endereço: ${$("#endereco").value.trim()}` : "Vou retirar no local",
    `Pagamento: ${$("#pagamento").value}`,
    $("#obs").value.trim() ? `Observações: ${$("#obs").value.trim()}` : ""
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}

/* --- Eventos --- */
$("#abas").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (!b) return; estado.cat = b.dataset.cat; renderAbas(); renderLista(); });
$("#busca").addEventListener("input", (e) => { estado.busca = e.target.value; renderLista(); });
$("#lista").addEventListener("change", (e) => {
  if (!e.target.matches("input[type=radio]")) return;
  const id = +e.target.dataset.id; estado.tam[id] = e.target.value;
  $(`[data-preco="${id}"]`).textContent = moeda(pizza(id).p[e.target.value]);   // preço instantâneo
});
$("#lista").addEventListener("click", (e) => { const b = e.target.closest("[data-add]"); if (b) adicionar(+b.dataset.add); });
$("#itens").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const par = (k) => b.dataset[k].split("|").map((v, i) => i ? v : +v);
  if (b.dataset.mais) mudar(...par("mais"), 1);
  else if (b.dataset.menos) mudar(...par("menos"), -1);
  else if (b.dataset.rem) remover(...par("rem"));
});
$("#form").addEventListener("change", (e) => {
  if (e.target.name === "tipo") { $("#c-end").style.display = e.target.value === "entrega" ? "" : "none"; renderCarrinho(); }
});
$("#abrir").addEventListener("click", () => gaveta(true));
$("#fechar").addEventListener("click", () => gaveta(false));
$("#fundo").addEventListener("click", () => gaveta(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("aberto")) gaveta(false); });
$("#enviar").addEventListener("click", enviar);

/* --- Inicialização --- */
$("#ano").textContent = new Date().getFullYear();
$("#link-zap").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá, Forneria São Bento!")}`;
renderAbas(); renderLista(); renderCarrinho(); renderHorarios(); atualizarStatus();
setInterval(atualizarStatus, 60000);