"use client";

import { useLanguage } from "./LanguageProvider";

export default function VideoCard({
	video,
	admin = false,
	onToggle,
	onDelete,
}) {
	const language = useLanguage();
	const t = language?.t ?? ((key) => key);

	return (
		<article className="video-card">
			{video.thumbnail_url && <img src={video.thumbnail_url} alt="" />}

			<div>
				<p className="eyebrow">
					{video.date || t("video.undated")}
					{admin
						? ` / ${video.is_public ? t("common.public") : t("common.private")}`
						: ""}
				</p>

				<h2>{video.title}</h2>
				<p>{video.description}</p>
				<p className="muted">{(video.tags || []).join(", ")}</p>

				<div className="actions">
					<a
						className="button-link"
						href={video.youtube_url}
						target="_blank"
						rel="noreferrer"
					>
						{t("common.watch")}
					</a>

					{admin && (
						<>
							<button onClick={() => onToggle(video)}>
								{video.is_public ? t("common.makePrivate") : t("common.makePublic")}
							</button>

							<button onClick={() => onDelete(video)}>
								{t("common.delete")}
							</button>
						</>
					)}
				</div>
			</div>
		</article>
	);
}
