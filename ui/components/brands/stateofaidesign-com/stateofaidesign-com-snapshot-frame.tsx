type SnapshotReplicaProps = {
  page: string;
  title: string;
  height: number;
};

export function StateofaidesignSnapshotFrame({
  page,
  title,
  height,
}: SnapshotReplicaProps) {
  return (
    <main className="min-h-screen bg-black">
      <iframe
        title={title}
        src={`/brands/stateofaidesign-com/html/${page}-snapshot.html`}
        sandbox=""
        className="block w-full border-0"
        style={{ height }}
      />
    </main>
  );
}
