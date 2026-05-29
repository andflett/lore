export function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex flex-row-reverse items-start gap-2.5">
      {/* Role pip — small gold square */}
      <span
        aria-hidden
        className="mt-4 block h-1.5 w-1.5 flex-shrink-0 bg-gold sm:mt-[15px] sm:h-[5px] sm:w-[5px]"
      />
      <div className="max-w-[90%] sm:max-w-[78%]">
        <div
          className="border border-gold-b2 border-r-[3px] border-r-gold-b3 bg-stone-s2 px-3.5 py-2.5 text-[15px] leading-snug text-text-t2"
          style={{
            background:
              "linear-gradient(180deg, var(--color-stone-s3) 0%, var(--color-stone-s2) 100%)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          <span className="whitespace-pre-wrap">{content}</span>
        </div>
      </div>
    </div>
  );
}
