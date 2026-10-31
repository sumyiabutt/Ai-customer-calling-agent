"""Approved FAQ knowledge base for the calling agent (Week 2).

The agent may only answer from content the client has approved. In Week 1 the
FAQ list was a plain list of dictionaries inside ``src.sample_data``. This
module turns that content into validated, read-only entries and adds a small
scoring lookup, so the dialogue layer never has to handle raw dictionaries and
a malformed entry fails at load time instead of mid-call.

There is no vector search or LLM here yet: retrieval is keyword scoring, which
keeps every answer traceable to one approved entry.
"""

from __future__ import annotations

from collections.abc import Iterator, Mapping, Sequence
from dataclasses import dataclass

from .sample_data import FAQ_ENTRIES


@dataclass(frozen=True)
class FaqEntry:
    """One approved question and its spoken answer."""

    id: str
    question: str
    answer: str
    keywords: tuple[str, ...]

    @classmethod
    def from_mapping(cls, data: Mapping[str, object]) -> "FaqEntry":
        """Build and validate an entry from sample_data-style content."""
        if not isinstance(data, Mapping):
            raise ValueError(f"FAQ entry must be a mapping, got {type(data).__name__}")
        entry = cls(
            id=_required_text(data, "id"),
            question=_optional_text(data, "question"),
            answer=_required_text(data, "answer"),
            keywords=_keyword_tuple(data.get("keywords")),
        )
        return entry.validate()

    def validate(self) -> "FaqEntry":
        """Raise ValueError if the entry could produce a bad answer."""
        if not self.id:
            raise ValueError("FAQ entry needs an id")
        if not self.answer:
            raise ValueError(f"FAQ entry {self.id!r} needs an answer")
        if not self.keywords:
            raise ValueError(f"FAQ entry {self.id!r} needs at least one keyword")
        return self


def _required_text(data: Mapping[str, object], key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"FAQ entry needs a non-empty {key!r}")
    return value.strip()


def _optional_text(data: Mapping[str, object], key: str) -> str:
    value = data.get(key, "")
    if not isinstance(value, str):
        raise ValueError(f"FAQ entry {key!r} must be text")
    return value.strip()


def _keyword_tuple(value: object) -> tuple[str, ...]:
    if isinstance(value, str):
        value = (value,)
    if not isinstance(value, (list, tuple, set, frozenset)):
        raise ValueError("FAQ entry keywords must be a list of phrases")
    keywords = tuple(str(item).strip().lower() for item in value if str(item).strip())
    return keywords


class KnowledgeBase:
    """Immutable collection of approved FAQ entries with keyword lookup."""

    def __init__(
        self,
        entries: Sequence[FaqEntry | Mapping[str, object]] | None = None,
    ) -> None:
        source = FAQ_ENTRIES if entries is None else entries
        parsed = tuple(
            entry if isinstance(entry, FaqEntry) else FaqEntry.from_mapping(entry)
            for entry in source
        )
        seen: set[str] = set()
        for entry in parsed:
            if entry.id in seen:
                raise ValueError(f"Duplicate FAQ id: {entry.id!r}")
            seen.add(entry.id)
        self._entries = parsed

    def __len__(self) -> int:
        return len(self._entries)

    def __iter__(self) -> Iterator[FaqEntry]:
        return iter(self._entries)

    @property
    def ids(self) -> tuple[str, ...]:
        return tuple(entry.id for entry in self._entries)

    def find(self, normalized_text: str) -> FaqEntry | None:
        """Return the entry with the most keyword hits, or None.

        ``normalized_text`` must already be lower-cased and whitespace-collapsed
        (``src.agent.normalize_text``), so scoring stays a plain substring count.
        """
        if not isinstance(normalized_text, str):
            raise TypeError("normalized_text must be a string")
        if not normalized_text.strip():
            return None

        best_entry: FaqEntry | None = None
        best_score = 0
        for entry in self._entries:
            score = sum(1 for keyword in entry.keywords if keyword in normalized_text)
            if score > best_score:
                best_entry = entry
                best_score = score
        return best_entry
