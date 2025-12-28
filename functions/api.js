export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const now = Date.now();

  // ===== 注册 =====
  if (action === "register") {
    const d = await request.json();
    if (!d.username || !d.password)
      return new Response("bad", { status: 400 });

    await env.DB.prepare(
      "INSERT INTO users (username,password,ip,last_active) VALUES (?,?,?,?)"
    ).bind(d.username, d.password, ip, now).run();

    return Response.json({ ok: true });
  }

  // ===== 登录 =====
  if (action === "login") {
    const d = await request.json();
    const u = await env.DB.prepare(
      "SELECT * FROM users WHERE username=?"
    ).bind(d.username).first();

    if (!u || u.password !== d.password)
      return new Response("fail", { status: 401 });

    await env.DB.prepare(
      "UPDATE users SET ip=?, last_active=? WHERE id=?"
    ).bind(ip, now, u.id).run();

    return Response.json({ ok: true });
  }

  // ===== 视频分页 =====
  if (action === "videos") {
    const page = Number(url.searchParams.get("page") || 0);
    const size = 5;

    const list = await env.DB.prepare(
      "SELECT * FROM videos ORDER BY id DESC LIMIT ? OFFSET ?"
    ).bind(size, page * size).all();

    return Response.json(list.results);
  }

  // ===== 添加视频（管理员）=====
  if (action === "add_video") {
    const d = await request.json();
    if (!d.url || !d.type)
      return new Response("bad", { status: 400 });

    await env.DB.prepare(
      "INSERT INTO videos (title,url,type) VALUES (?,?,?)"
    ).bind(d.title || "", d.url, d.type).run();

    return Response.json({ ok: true });
  }

  // ===== 在线用户 =====
  if (action === "online") {
    const t = now - 5 * 60 * 1000;
    const list = await env.DB.prepare(
      "SELECT username,ip,last_active FROM users WHERE last_active>?"
    ).bind(t).all();

    return Response.json(list.results);
  }

  return new Response("404");
}
