'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Music } from "lucide-react";

export default function MusicPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Focus Music</h1>
        <p className="text-muted-foreground">
          Curated playlists from Spotify to help you concentrate.
        </p>
      </div>

      <div className="rounded-lg overflow-hidden aspect-video w-full">
        <iframe
          src="https://open.spotify.com/embed/playlist/0dSdptxq5L5VzULERfkvnz?utm_source=generator&theme=0"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Playlist"
        ></iframe>
      </div>
       <Alert className="mt-6">
          <Music className="h-4 w-4" />
          <AlertTitle>A Note on Full Song Playback</AlertTitle>
          <AlertDescription>
            Spotify&apos;s embedded player provides 30-second previews for users who are not logged into a Spotify account in their browser. To listen to the full tracks, please log in to Spotify in another browser tab.
            <br/><br/>
            A full integration that connects to personal Spotify accounts is a complex feature requiring backend authentication, which is beyond the scope of this prototyping tool.
          </AlertDescription>
        </Alert>
    </div>
  );
}
