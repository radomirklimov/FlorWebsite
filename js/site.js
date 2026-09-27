/* Shared behaviour: nav, socials, content rendering, FAQ, forms, reveal. No dependencies. */
(function () {
  "use strict";

  // Mobile nav
  var btn = document.querySelector("[data-menu-btn]");
  var links = document.querySelector("[data-nav-links]");
  if (btn && links) {
    btn.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Subtle reveal
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("visible"); });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function pill(label, url) {
    var a = document.createElement("a");
    a.className = "pill";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = label;
    return a;
  }

  function renderSongs(mount, songs, opts) {
    if (!mount || !Array.isArray(songs)) return;
    opts = opts || {};
    var list = songs.filter(function (s) {
      if (opts.featuredOnly) return s.featured;
      return true;
    });
    if (opts.limit) list = list.slice(0, opts.limit);
    mount.innerHTML = "";
    list.forEach(function (song) {
      var card = el("article", "card reveal visible" + (song.featured ? " featured" : ""));
      if (song.featured) card.appendChild(el("span", "tag", "Featured release"));
      var art = el("div", "song-art", "♪");
      art.setAttribute("role", "img");
      art.setAttribute("aria-label", "Artwork placeholder for " + song.title);
      card.appendChild(art);
      var h = el("h3", null, song.title);
      card.appendChild(h);
      card.appendChild(el("p", "song-meta", [song.releaseDate, song.genre].filter(Boolean).join(" · ")));
      card.appendChild(el("p", null, song.description)).style.color = "var(--muted)";
      var row = el("div", "listen-row");
      var hasLink = false;
      Object.keys(song.externalLinks || {}).forEach(function (platform) {
        var url = song.externalLinks[platform];
        if (url) { row.appendChild(pill(platform, url)); hasLink = true; }
      });
      if (!hasLink) row.appendChild(el("span", "song-meta", "Listening links coming soon."));
      card.appendChild(row);
      mount.appendChild(card);
    });
  }

  function renderLessons(mount, lessons) {
    if (!mount || !Array.isArray(lessons)) return;
    mount.innerHTML = "";
    lessons.filter(function (l) { return l.active !== false; }).forEach(function (lesson) {
      var card = el("article", "card reveal visible" + (lesson.featured ? " featured" : ""));
      if (lesson.featured) card.appendChild(el("span", "tag", "Most popular"));
      card.appendChild(el("h3", null, lesson.title));
      var meta = el("p", "song-meta", lesson.duration + " · For " + lesson.targetAudience + " · " + lesson.format);
      card.appendChild(meta);
      var desc = el("p", null, lesson.shortDescription);
      desc.style.color = "var(--muted)";
      card.appendChild(desc);
      var price = el("p", "price", lesson.price + " ");
      var per = el("small", null, "/ " + lesson.duration);
      price.appendChild(per);
      card.appendChild(price);
      var ul = el("ul", "includes");
      (lesson.includes || []).forEach(function (item) { ul.appendChild(el("li", null, item)); });
      card.appendChild(ul);
      var cta = el("a", "btn btn-ghost btn-small", "Ask about this lesson");
      cta.href = "contact.html?topic=lesson&lesson=" + encodeURIComponent(lesson.id);
      cta.style.marginTop = "18px";
      card.appendChild(cta);
      mount.appendChild(card);
    });
  }

  function renderSocials(mount, socials) {
    if (!mount || !Array.isArray(socials)) return;
    mount.innerHTML = "";
    socials.filter(function (s) { return !!s.url; }).forEach(function (s) {
      mount.appendChild(pill(s.label, s.url));
    });
  }

  // Load JSON content (progressive enhancement; static fallback already in HTML)
  function loadJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).catch(function () { return null; });
  }

  var songMounts = document.querySelectorAll("[data-songs]");
  var lessonMounts = document.querySelectorAll("[data-lessons]");
  var socialMounts = document.querySelectorAll("[data-socials]");
  if (songMounts.length || lessonMounts.length || socialMounts.length) {
    Promise.all([loadJSON("content/songs.json"), loadJSON("content/lessons.json"), loadJSON("content/site.json")])
      .then(function (res) {
        var songs = res[0], lessons = res[1], site = res[2];
        songMounts.forEach(function (m) {
          if (!songs) return;
          // Only re-render if JSON loaded; keeps file:// fallback intact otherwise
          renderSongs(m, songs, { featuredOnly: m.hasAttribute("data-featured-only"), limit: parseInt(m.getAttribute("data-limit") || "0", 10) || undefined });
        });
        lessonMounts.forEach(function (m) { if (lessons) renderLessons(m, lessons); });
        socialMounts.forEach(function (m) { if (site) renderSocials(m, site.socials); });
      });
  }

  // Contact form: validate + mailto fallback (no backend required)
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    // Preselect topic/lesson from query string (e.g. lessons page CTA)
    try {
      var q = new URLSearchParams(window.location.search);
      var topic = q.get("topic");
      var lessonId = q.get("lesson");
      if (topic) {
        var sel = form.querySelector("#interest");
        if (sel) sel.value = topic.charAt(0).toUpperCase() + topic.slice(1);
      }
      if (lessonId) {
        var msg = form.querySelector("#message");
        if (msg && !msg.value) msg.value = "Hi! I'm interested in the lesson: " + lessonId + ". ";
      }
    } catch (e) { /* ignore */ }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var message = form.querySelector("#message");
      var ok = true;
      [[name, name.value.trim().length >= 2], [email, /.+@.+\..+/.test(email.value.trim())], [message, message.value.trim().length >= 5]]
        .forEach(function (pair) {
          var input = pair[0], valid = pair[1];
          var err = form.querySelector('[data-error-for="' + input.id + '"]');
          if (!valid) {
            ok = false;
            input.setAttribute("aria-invalid", "true");
            if (err) err.textContent = "Please complete this field correctly.";
          } else {
            input.removeAttribute("aria-invalid");
            if (err) err.textContent = "";
          }
        });
      if (!ok) return;
      var to = form.getAttribute("data-email") || "hello@example.com";
      var interest = form.querySelector("#interest");
      var subject = encodeURIComponent("Website inquiry from " + name.value.trim());
      var body = encodeURIComponent(
        "Name: " + name.value.trim() + "\nEmail: " + email.value.trim() +
        "\nInterested in: " + (interest ? interest.value : "-") + "\n\n" + message.value.trim()
      );
      window.location.href = "mailto:" + to + "?subject=" + subject + "&body=" + body;
      var note = form.querySelector("[data-form-status]");
      if (note) note.textContent = "Opening your email app — if nothing happens, write to " + to + ".";
    });
  }
})();
