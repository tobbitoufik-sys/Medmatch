import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 62,
    paddingBottom: 60,
    paddingHorizontal: 62,
    backgroundColor: "#FFFFFF",
    color: "#222222",
    fontSize: 11.2,
    lineHeight: 1.5,
    fontFamily: "Helvetica"
  },
  paragraph: {
    marginBottom: 14
  },
  paragraphText: {
    whiteSpace: "pre-wrap"
  },
  senderBlock: {
    marginBottom: 18
  },
  recipientBlock: {
    marginBottom: 22
  },
  placeDateLine: {
    marginBottom: 18
  },
  subjectLine: {
    marginBottom: 18
  },
  subjectText: {
    fontFamily: "Helvetica-Bold"
  },
  salutation: {
    marginBottom: 14
  },
  bodyParagraph: {
    marginBottom: 12
  },
  closing: {
    marginTop: 8,
    marginBottom: 22
  },
  signature: {
    marginTop: 6
  }
});

function buildParagraphs(letter: string) {
  return letter
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getParagraphVariant(paragraph: string, index: number, paragraphs: string[]) {
  if (index === 0) {
    return "sender";
  }

  if (/^(Sehr geehrte|Sehr geehrter)\b/.test(paragraph)) {
    return "salutation";
  }

  if (/^Betreff:\s*/i.test(paragraph)) {
    return "subject";
  }

  if (/,\s*den \d{2}\.\d{2}\.\d{4}$/i.test(paragraph) || /^den \d{2}\.\d{2}\.\d{4}$/i.test(paragraph)) {
    return "placeDate";
  }

  if (/^Mit freundlichen Grueßen,?$/i.test(paragraph) || /^Mit freundlichen Grüßen,?$/i.test(paragraph)) {
    return "closing";
  }

  if (index > 0 && index < 3 && paragraph.includes("\n")) {
    return "recipient";
  }

  if (index === paragraphs.length - 1) {
    return "signature";
  }

  return "body";
}

export function CoverLetterPdfDocument({
  letter
}: {
  letter: string;
}) {
  const paragraphs = buildParagraphs(letter);

  return (
    <Document title="Motivationsschreiben">
      <Page size="A4" style={styles.page}>
        <View>
          {paragraphs.map((paragraph, index) => {
            const variant = getParagraphVariant(paragraph, index, paragraphs);
            const style =
              variant === "sender"
                ? styles.senderBlock
                : variant === "recipient"
                  ? styles.recipientBlock
                  : variant === "placeDate"
                    ? styles.placeDateLine
                    : variant === "subject"
                      ? styles.subjectLine
                      : variant === "salutation"
                        ? styles.salutation
                        : variant === "closing"
                          ? styles.closing
                          : variant === "signature"
                            ? styles.signature
                            : styles.bodyParagraph;

            return (
              <View key={`${index}-${paragraph.slice(0, 20)}`} style={[styles.paragraph, style]}>
                <Text
                  style={[
                    styles.paragraphText,
                    ...(variant === "subject" ? [styles.subjectText] : [])
                  ]}
                >
                  {paragraph}
                </Text>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}
