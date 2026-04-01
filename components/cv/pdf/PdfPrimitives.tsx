import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";

import type {
  CvPdfData,
  CvPdfEntry,
  CvPdfMainSectionOrderKey
} from "@/components/cv/pdf/buildCvPdfData";
import type {
  PdfMainSectionKey,
  PdfSidebarSectionKey,
  PdfTemplateConfig
} from "@/components/cv/pdf/pdfTemplateConfig";
import { normalizePdfText } from "@/components/cv/pdf/pdfText";
import {
  getCvPhotoObjectPosition,
  normalizeCvPhotoPresentation
} from "@/components/cv/v2/cv-photo-state";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    color: "#162033"
  },
  shell: {
    minHeight: "95%",
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1
  },
  sidebar: {
    minHeight: "100%"
  },
  sidebarInner: {
    minHeight: "100%",
    flexDirection: "column"
  },
  sidebarPhotoWrap: {
    alignItems: "center"
  },
  photoFrame: {
    backgroundColor: "#edf3f1",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center"
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  photoFallback: {
    fontSize: 30,
    fontWeight: 700,
    color: "#395364"
  },
  sidebarName: {
    fontWeight: 700,
    color: "#162033",
    marginBottom: 4
  },
  sidebarSubtitle: {
    lineHeight: 1.35,
    color: "#4c6270"
  },
  sidebarStack: {
    flexDirection: "column"
  },
  sideTitle: {
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#516572",
    marginBottom: 8
  },
  sideText: {
    lineHeight: 1.45,
    color: "#243443",
    marginBottom: 4
  },
  kicker: {
    fontSize: 8.8,
    textTransform: "uppercase",
    color: "#8ea1af",
    marginBottom: 10
  },
  fullName: {
    fontSize: 27,
    fontWeight: 700,
    lineHeight: 1.08,
    color: "#101828",
    marginBottom: 5
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 1.38,
    color: "#536576"
  },
  sectionTitle: {
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#566877",
    marginBottom: 9
  },
  entries: {
    flexDirection: "column"
  },
  entry: {
    breakInside: "avoid"
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  entryLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12
  },
  dateColumn: {
    flexShrink: 0,
    alignItems: "flex-end"
  },
  entryTitle: {
    fontSize: 11.1,
    fontWeight: 700,
    lineHeight: 1.28,
    color: "#162033"
  },
  entryDate: {
    fontSize: 9.7,
    lineHeight: 1.28,
    color: "#6b7280",
    textAlign: "right"
  },
  entryBody: {
    paddingTop: 3
  },
  entrySubtitle: {
    fontSize: 10.2,
    lineHeight: 1.38,
    color: "#425567"
  },
  entryMeta: {
    fontSize: 9.9,
    lineHeight: 1.34,
    color: "#61717f",
    marginTop: 2
  },
  bulletList: {
    paddingTop: 4,
    paddingLeft: 8
  },
  bullet: {
    fontSize: 9.8,
    lineHeight: 1.42,
    color: "#314152",
    marginTop: 3
  }
});

function getDensityValue(
  config: PdfTemplateConfig,
  compactValue: number,
  comfortableValue: number
) {
  return config.density === "compact" ? compactValue : comfortableValue;
}

function getSidebarSectionItems(data: CvPdfData, key: PdfSidebarSectionKey) {
  if (key === "contact") {
    return { title: "Kontakt", items: data.contact };
  }

  return { title: "Sprachen", items: data.languages };
}

function getMainSectionEntries(data: CvPdfData, key: PdfMainSectionKey) {
  if (key === "workExperience") {
    return { title: "Berufserfahrung", entries: data.workExperience };
  }

  if (key === "education") {
    return { title: "Ausbildung", entries: data.education };
  }

  if (key === "additionalSections") {
    return { title: "Weitere Angaben", entries: data.additionalSections };
  }

  return { title: "Fortbildungen", entries: data.fortbildungen };
}

function getMainColumnWidth(sidebarWidth: string) {
  const parsedWidth = Number.parseFloat(sidebarWidth);

  if (Number.isNaN(parsedWidth)) {
    return "68%";
  }

  return `${100 - parsedWidth}%`;
}

function isSoftTimeline(config: PdfTemplateConfig) {
  return config.variant === "softTimeline";
}

function isSlateProfile(config: PdfTemplateConfig) {
  return config.variant === "slateProfile";
}

export function PdfPhotoBlock({
  config,
  initials,
  photoUrl,
  preparedPhotoSrc,
  photoPresentation
}: {
  config: PdfTemplateConfig;
  initials: string;
  photoUrl?: string | null;
  preparedPhotoSrc?: CvPdfData["identity"]["preparedPhotoSrc"];
  photoPresentation?: CvPdfData["identity"]["photoPresentation"];
}) {
  const photoConfig = config.sidebar.photo;
  const normalizedPhotoPresentation = normalizeCvPhotoPresentation(
    photoPresentation,
    config.photoShape
  );
  const renderPhotoSrc = preparedPhotoSrc ?? photoUrl;

  return (
    <View
      style={config.photoShape === "circle" ? styles.sidebarPhotoWrap : undefined}
    >
      <View
        style={[
          styles.photoFrame,
          {
            width: photoConfig.width,
            height: photoConfig.height,
            borderRadius: photoConfig.radius,
            borderColor: photoConfig.borderColor,
            borderWidth: photoConfig.borderWidth,
            marginBottom: photoConfig.marginBottom
          }
        ]}
      >
        {renderPhotoSrc ? (
          <Image
            src={renderPhotoSrc}
            style={[
              styles.photo,
              ...(preparedPhotoSrc
                ? []
                : [
                    {
                      objectPosition:
                        photoConfig.objectPosition ??
                        getCvPhotoObjectPosition(normalizedPhotoPresentation)
                    }
                  ])
            ]}
          />
        ) : (
          <Text style={styles.photoFallback}>{initials}</Text>
        )}
      </View>
    </View>
  );
}

function PdfSoftTimelineTop({
  config,
  data
}: {
  config: PdfTemplateConfig;
  data: CvPdfData;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#D9D9D6",
        marginBottom: 20,
        paddingBottom: 20
      }}
    >
      <View
        style={{
          width: "28%",
          backgroundColor: "#DCEBEC",
          borderTopRightRadius: 28,
          borderBottomRightRadius: 28,
          paddingVertical: 24,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 180
        }}
      >
        <PdfPhotoBlock
          config={config}
          initials={data.identity.initials}
          photoUrl={data.identity.photoUrl}
          preparedPhotoSrc={data.identity.preparedPhotoSrc}
          photoPresentation={data.identity.photoPresentation}
        />
      </View>
      <View
        style={{
          width: "72%",
          paddingLeft: 26,
          paddingTop: 10
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#222222",
            lineHeight: 1.08,
            marginBottom: 6
          }}
        >
          {data.identity.fullName}
        </Text>
        {data.identity.subtitle ? (
          <Text
            style={{
              fontSize: 11,
              color: "#4F4F4F",
              lineHeight: 1.4,
              marginBottom: 12
            }}
          >
            {normalizePdfText(data.identity.subtitle)}
          </Text>
        ) : null}
        {data.contact.length ? (
          <View style={{ flexDirection: "column", gap: 4 }}>
            {data.contact.map((item) => (
              <Text
                key={item}
                style={{
                  fontSize: 9.8,
                  lineHeight: 1.45,
                  color: "#4F4F4F"
                }}
              >
                {normalizePdfText(item)}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PdfTimelineEntryRow({
  entry
}: {
  entry: CvPdfEntry;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        marginBottom: 14
      }}
      wrap={false}
    >
      <View style={{ width: 86, paddingRight: 10 }}>
        {entry.dateLabel || entry.sinceLabel ? (
          <Text
            style={{
              fontSize: 9.5,
              lineHeight: 1.35,
              color: "#6F6F6F"
            }}
          >
            {normalizePdfText(entry.sinceLabel ?? entry.dateLabel ?? "")}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          width: 18,
          alignItems: "center"
        }}
      >
        <View
          style={{
            width: 2,
            flex: 1,
            minHeight: 8,
            backgroundColor: "#8FC7D2"
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 2,
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: "#8FC7D2"
          }}
        />
      </View>
      <View style={{ flex: 1, paddingLeft: 12 }}>
        <Text
          style={{
            fontSize: 11.2,
            fontWeight: 700,
            lineHeight: 1.28,
            color: "#222222"
          }}
        >
          {normalizePdfText(entry.title)}
        </Text>
        {entry.itemType === "medical_license" ? (
          <>
            {entry.issuerLine ? (
              <Text
                style={{
                  fontSize: 10,
                  lineHeight: 1.38,
                  color: "#4F4F4F",
                  marginTop: 2
                }}
              >
                {normalizePdfText(entry.issuerLine)}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            {entry.subtitle ? (
              <Text
                style={{
                  fontSize: 10,
                  lineHeight: 1.38,
                  color: "#4F4F4F",
                  marginTop: 2
                }}
              >
                {normalizePdfText(entry.subtitle)}
              </Text>
            ) : null}
            {entry.meta ? (
              <Text
                style={{
                  fontSize: 9.7,
                  lineHeight: 1.34,
                  color: "#6F6F6F",
                  marginTop: 2
                }}
              >
                {normalizePdfText(entry.meta)}
              </Text>
            ) : null}
          </>
        )}
        {entry.bullets?.length ? (
          <View style={{ paddingTop: 4 }}>
            {entry.bullets.map((bullet) => (
              <Text
                key={`${entry.id}-${bullet}`}
                style={{
                  fontSize: 9.6,
                  lineHeight: 1.42,
                  color: "#4F4F4F",
                  marginTop: 3
                }}
              >
                - {normalizePdfText(bullet)}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PdfTimelineSectionBlock({
  title,
  entries
}: {
  title: string;
  entries: CvPdfEntry[];
}) {
  if (!entries.length) {
    return null;
  }

  return (
    <View style={{ marginTop: 14 }}>
      <View
        style={{
          marginBottom: 10,
          borderTopWidth: 1,
          borderTopColor: "#D9D9D6",
          paddingTop: 12
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            color: "#222222"
          }}
        >
          {title}
        </Text>
        <View
          style={{
            width: 40,
            height: 3,
            borderRadius: 999,
            backgroundColor: "#8FC7D2",
            marginTop: 6
          }}
        />
      </View>
      <View>
        {entries.map((entry) => (
          <PdfTimelineEntryRow key={entry.id} entry={entry} />
        ))}
      </View>
    </View>
  );
}

function PdfSlateSectionHeading({ title }: { title: string }) {
  const badgeIcon =
    title === "Berufserfahrung" ? (
      <View style={{ width: 11, height: 9, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 10,
            height: 6,
            borderWidth: 1.2,
            borderColor: "#FFFFFF",
            borderRadius: 1
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            width: 5,
            height: 2,
            borderWidth: 1.2,
            borderBottomWidth: 0,
            borderColor: "#FFFFFF",
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
            backgroundColor: "#111827"
          }}
        />
      </View>
    ) : title === "Ausbildung" ? (
      <View style={{ width: 12, height: 10, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 6,
            borderRightWidth: 6,
            borderBottomWidth: 4,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: "#FFFFFF",
            marginTop: -1
          }}
        />
        <View
          style={{
            width: 8,
            height: 1.4,
            backgroundColor: "#FFFFFF",
            marginTop: 1.5
          }}
        />
      </View>
    ) : (
      <View style={{ width: 11, height: 9, justifyContent: "space-between" }}>
        {[0, 1, 2].map((line) => (
          <View key={line} style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 2.2,
                height: 2.2,
                borderRadius: 999,
                backgroundColor: "#FFFFFF",
                marginRight: 2.2
              }}
            />
            <View
              style={{
                flex: 1,
                height: 1.2,
                backgroundColor: "#FFFFFF",
                borderRadius: 999
              }}
            />
          </View>
        ))}
      </View>
    );

  return (
    <View style={{ marginTop: 18, marginBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10
          }}
        >
          {badgeIcon}
        </View>
        <Text
          style={{
            fontSize: 11.2,
            fontWeight: 700,
            color: "#222222"
          }}
        >
          {title}
        </Text>
      </View>
      <View
        style={{
          marginTop: 8,
          marginLeft: 32,
          height: 1,
          backgroundColor: "#CFCFCA"
        }}
      />
    </View>
  );
}

function PdfSlateEntryRow({ entry }: { entry: CvPdfEntry }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 12 }} wrap={false}>
      <View style={{ width: 108, paddingRight: 14 }}>
        {entry.sinceLabel || entry.dateLabel ? (
          <Text
            style={{
              fontSize: 9.5,
              lineHeight: 1.35,
              color: "#6F6F6F"
            }}
          >
            {normalizePdfText(entry.sinceLabel ?? entry.dateLabel ?? "")}
          </Text>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.3,
            color: "#222222"
          }}
        >
          {normalizePdfText(entry.title)}
        </Text>
        {entry.itemType === "medical_license" ? (
          <>
            {entry.issuerLine ? (
              <Text
                style={{
                  fontSize: 10,
                  lineHeight: 1.38,
                  color: "#4F4F4F",
                  marginTop: 2
                }}
              >
                {normalizePdfText(entry.issuerLine)}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            {entry.subtitle ? (
              <Text
                style={{
                  fontSize: 10,
                  lineHeight: 1.38,
                  color: "#4F4F4F",
                  marginTop: 2
                }}
              >
                {normalizePdfText(entry.subtitle)}
              </Text>
            ) : null}
            {entry.meta ? (
              <Text
                style={{
                  fontSize: 9.7,
                  lineHeight: 1.34,
                  color: "#6F6F6F",
                  marginTop: 2
                }}
              >
                {normalizePdfText(entry.meta)}
              </Text>
            ) : null}
          </>
        )}
        {entry.bullets?.length ? (
          <View style={{ paddingTop: 4 }}>
            {entry.bullets.map((bullet) => (
              <Text
                key={`${entry.id}-${bullet}`}
                style={{
                  fontSize: 9.6,
                  lineHeight: 1.42,
                  color: "#4F4F4F",
                  marginTop: 3
                }}
              >
                - {normalizePdfText(bullet)}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PdfSlateSection({
  title,
  entries
}: {
  title: string;
  entries: CvPdfEntry[];
}) {
  if (!entries.length) {
    return null;
  }

  return (
    <View>
      <PdfSlateSectionHeading title={title} />
      <View>
        {entries.map((entry) => (
          <PdfSlateEntryRow key={entry.id} entry={entry} />
        ))}
      </View>
    </View>
  );
}

function PdfSlateFreeTitle({ title }: { title: string }) {
  return (
    <View style={{ marginTop: 18, marginBottom: 8 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#222222"
        }}
      >
        {normalizePdfText(title)}
      </Text>
      <View
        style={{
          marginTop: 7,
          height: 1,
          backgroundColor: "#CFCFCA"
        }}
      />
    </View>
  );
}

function PdfSlateContactIcon({ item }: { item: string }) {
  const normalized = item.toLowerCase();
  const isEmail = normalized.includes("@");
  const isPhone = /^\+?[\d\s()/.-]+$/.test(item.trim()) || normalized.includes("tel");
  const isAddress =
    /\d/.test(item) &&
    /(str|straße|strasse|weg|platz|allee|gasse|haus)/i.test(item);
  const isLocation =
    !isEmail &&
    !isPhone &&
    !isAddress &&
    /(deutschland|germany|berlin|hamburg|münchen|muenchen|köln|koeln|frankfurt)/i.test(
      normalized
    );

  if (isEmail) {
    return (
      <View style={{ width: 14, height: 10, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 12,
            height: 8,
            borderWidth: 1,
            borderColor: "#6F6F6F",
            borderRadius: 1
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 2,
            width: 8,
            height: 8,
            borderLeftWidth: 1,
            borderTopWidth: 1,
            borderColor: "#6F6F6F",
            transform: "rotate(45deg)"
          }}
        />
      </View>
    );
  }

  if (isPhone) {
    return (
      <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 7,
            height: 10,
            borderLeftWidth: 1.2,
            borderRightWidth: 1.2,
            borderTopWidth: 1.2,
            borderColor: "#6F6F6F",
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
            transform: "rotate(35deg)"
          }}
        />
      </View>
    );
  }

  if (isAddress) {
    return (
      <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 10,
            height: 7,
            borderWidth: 1,
            borderColor: "#6F6F6F",
            borderTopWidth: 0
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 2,
            width: 8,
            height: 8,
            borderLeftWidth: 1,
            borderTopWidth: 1,
            borderColor: "#6F6F6F",
            transform: "rotate(45deg)"
          }}
        />
      </View>
    );
  }

  if (isLocation) {
    return (
      <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderWidth: 1,
            borderColor: "#6F6F6F",
            borderRadius: 999,
            borderBottomLeftRadius: 999,
            transform: "rotate(45deg)"
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 2.5,
            height: 2.5,
            borderRadius: 999,
            backgroundColor: "#6F6F6F"
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderWidth: 1,
          borderColor: "#6F6F6F",
          borderRadius: 999
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 3,
          height: 3,
          borderRadius: 999,
          backgroundColor: "#6F6F6F"
        }}
      />
    </View>
  );
}

function buildSlateContactRows(contactItems: string[]) {
  const phone = contactItems.find(
    (item) => /^\+?[\d\s()/.-]+$/.test(item.trim()) || item.toLowerCase().includes("tel")
  );
  const email = contactItems.find((item) => item.includes("@"));
  const addressLine = contactItems.find(
    (item) =>
      /\d/.test(item) && /(str|straße|strasse|weg|platz|allee|gasse|haus)/i.test(item)
  );
  const locationLine = contactItems.find(
    (item) =>
      item !== phone &&
      item !== email &&
      item !== addressLine &&
      !/\d/.test(item)
  );

  const rows: Array<{ key: string; iconKey: string; value: string }> = [];

  if (phone) {
    rows.push({ key: `phone-${phone}`, iconKey: phone, value: phone });
  }

  if (email) {
    rows.push({ key: `email-${email}`, iconKey: email, value: email });
  }

  if (addressLine || locationLine) {
    const addressParts = (addressLine ?? "").split(",").map((part) => part.trim()).filter(Boolean);
    const streetPart = addressParts[0] ?? null;
    const postalPart = addressParts[1] ?? null;
    const cityPart = locationLine
      ? locationLine
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
          .find((part) => !/deutschland|germany/i.test(part)) ?? null
      : null;

    const combinedAddress = [streetPart, postalPart && cityPart ? `${postalPart} ${cityPart}` : postalPart ?? cityPart]
      .filter((part): part is string => Boolean(part))
      .join("\n");

    if (combinedAddress) {
      rows.push({
        key: `address-${combinedAddress}`,
        iconKey: streetPart ?? postalPart ?? cityPart ?? "address",
        value: combinedAddress
      });
    }
  }

  return rows;
}

export function PdfCompactSection({
  config,
  title,
  items
}: {
  config: PdfTemplateConfig;
  title: string;
  items: string[];
}) {
  if (!items.length) {
    return null;
  }

  const blockStyle = config.sidebar.blockDividerColor
    ? {
        paddingBottom: config.sidebar.blockPaddingBottom ?? 0,
        borderBottomWidth: 1,
        borderBottomColor: config.sidebar.blockDividerColor
      }
    : {};

    return (
      <View style={blockStyle} wrap={false}>
        <Text
          style={[
            styles.sideTitle,
            {
              fontSize: config.sections.titleSize,
              letterSpacing: config.sections.titleLetterSpacing,
              color: config.theme.sectionTitleColor
            }
          ]}
        >
          {title}
        </Text>
      {items.map((item) => (
        <Text key={item} style={[styles.sideText, { fontSize: 10.2 }]}>
          {normalizePdfText(item)}
        </Text>
      ))}
    </View>
  );
}

export function PdfDateColumn({
  config,
  dateLabel
}: {
  config: PdfTemplateConfig;
  dateLabel?: string | null;
}) {
  if (!dateLabel) {
    return null;
  }

  return (
    <View style={[styles.dateColumn, { width: config.dateColumnWidth }]}>
      <Text style={[styles.entryDate, { color: config.theme.entryDateColor }]}>
        {normalizePdfText(dateLabel)}
      </Text>
    </View>
  );
}

export function PdfEntryRow({
  config,
  entry
}: {
  config: PdfTemplateConfig;
  entry: CvPdfEntry;
}) {
  const isMedicalLicense = entry.itemType === "medical_license";

  return (
    <View
      style={[styles.entry, { marginBottom: getDensityValue(config, 10, 12) }]}
      wrap={false}
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryLeft}>
            <Text style={[styles.entryTitle, { color: config.theme.entryTitleColor }]}>
              {normalizePdfText(entry.title)}
            </Text>
          </View>
        <PdfDateColumn
          config={config}
          dateLabel={isMedicalLicense ? entry.sinceLabel : entry.dateLabel}
        />
      </View>

      {(entry.subtitle || entry.meta || entry.bullets?.length || entry.issuerLine || entry.sinceLabel) ? (
        <View style={styles.entryBody}>
            {isMedicalLicense ? (
              <>
                {entry.issuerLine ? (
                  <Text style={[styles.entrySubtitle, { color: config.theme.entrySubtitleColor }]}>
                    {normalizePdfText(entry.issuerLine)}
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                {entry.subtitle ? (
                  <Text style={[styles.entrySubtitle, { color: config.theme.entrySubtitleColor }]}>
                    {normalizePdfText(entry.subtitle)}
                  </Text>
                ) : null}
                {entry.meta ? (
                  <Text style={[styles.entryMeta, { color: config.theme.entryMetaColor }]}>
                    {normalizePdfText(entry.meta)}
                  </Text>
                ) : null}
              </>
            )}
            {entry.bullets?.length ? (
              <View style={styles.bulletList}>
                {entry.bullets.map((bullet) => (
                  <Text
                    key={`${entry.id}-${bullet}`}
                    style={[styles.bullet, { color: config.theme.bulletColor }]}
                  >
                    - {normalizePdfText(bullet)}
                  </Text>
                ))}
              </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function PdfSectionBlock({
  config,
  title,
  entries,
  compact = false
}: {
  config: PdfTemplateConfig;
  title: string;
  entries: CvPdfEntry[];
  compact?: boolean;
}) {
  if (!entries.length) {
    return null;
  }

  const sectionDividerStyle = config.sections.topBorderColor
    ? {
        borderTopWidth: 1,
        borderTopColor: config.sections.topBorderColor,
        paddingTop: getDensityValue(config, 12, 13)
      }
    : {};

  return (
    <View
      style={[
        sectionDividerStyle,
        {
          marginTop: compact
            ? getDensityValue(config, 12, 13)
            : getDensityValue(config, 13, 15)
        }
      ]}
    >
      <View wrap={false}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: config.sections.titleSize,
                letterSpacing: config.sections.titleLetterSpacing,
                color: config.theme.sectionTitleColor
              }
            ]}
          >
          {title}
        </Text>
        {entries.length ? (
          <View style={styles.entries}>
            <PdfEntryRow config={config} entry={entries[0]} />
          </View>
        ) : null}
      </View>
      {entries.length > 1 ? (
        <View style={styles.entries}>
          {entries.slice(1).map((entry) => (
            <PdfEntryRow key={entry.id} config={config} entry={entry} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function PdfCustomBlock({
  config,
  block
}: {
  config: PdfTemplateConfig;
  block: NonNullable<CvPdfData["customBlock"]>;
}) {
  if (!block.entries.length && !block.title) {
    return null;
  }

  return (
    <View
      style={{
        marginTop: getDensityValue(config, 13, 15)
      }}
    >
      {block.title ? (
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: config.sections.titleSize,
                letterSpacing: config.sections.titleLetterSpacing,
                color: config.theme.sectionTitleColor
              }
            ]}
          >
            {normalizePdfText(block.title)}
          </Text>
      ) : null}
      <View style={styles.entries}>
        {block.entries.map((entry) => (
          <PdfEntryRow key={entry.id} config={config} entry={entry} />
        ))}
      </View>
    </View>
  );
}

export function PdfHeaderBlock({
  config,
  data
}: {
  config: PdfTemplateConfig;
  data: CvPdfData;
}) {
  const headerStyle = config.header.topBorderColor
    ? {
        borderTopWidth: 1,
        borderTopColor: config.header.topBorderColor,
        paddingTop: config.header.paddingTop ?? 0,
        paddingBottom: config.header.paddingBottom ?? 0
      }
    : {
        marginBottom: getDensityValue(config, 16, 18)
      };

    return (
      <View style={headerStyle}>
        {config.theme.accentBarColor ? (
          <View
            style={{
              width: 52,
              height: config.theme.accentBarHeight ?? 4,
              borderRadius: 999,
              backgroundColor: config.theme.accentBarColor,
              marginBottom: 10
            }}
          />
        ) : null}
        {config.header.showKicker ? (
          <Text
            style={[
              styles.kicker,
              {
                letterSpacing: config.header.kickerLetterSpacing,
                color: config.theme.kickerColor
              }
            ]}
          >
            Lebenslauf
          </Text>
        ) : null}
        {config.header.showName ? (
          <Text style={[styles.fullName, { color: config.theme.fullNameColor }]}>
            {data.identity.fullName}
          </Text>
        ) : null}
        {config.header.showSubtitle && data.identity.subtitle ? (
          <Text style={[styles.subtitle, { color: config.theme.subtitleColor }]}>
            {normalizePdfText(data.identity.subtitle)}
          </Text>
        ) : null}
      </View>
    );
  }

export function PdfSidebarLayout({
  config,
  data
}: {
  config: PdfTemplateConfig;
  data: CvPdfData;
}) {
  const identityConfig = config.sidebar.identity;

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: config.sidebarWidth,
          backgroundColor: config.sidebar.backgroundColor,
          paddingHorizontal: config.sidebar.paddingHorizontal,
          paddingTop: config.sidebar.paddingTop,
          paddingBottom: config.sidebar.paddingBottom
        }
      ]}
    >
      <View style={styles.sidebarInner}>
        <PdfPhotoBlock
          config={config}
          initials={data.identity.initials}
          photoUrl={data.identity.photoUrl}
          preparedPhotoSrc={data.identity.preparedPhotoSrc}
          photoPresentation={data.identity.photoPresentation}
        />

          {identityConfig?.show ? (
            <>
              <Text
                style={[
                  styles.sidebarName,
                  {
                    fontSize: identityConfig.nameSize,
                    color: config.theme.sidebarNameColor
                  }
                ]}
              >
                {data.identity.fullName}
              </Text>
              {data.identity.subtitle ? (
                <Text
                  style={[
                    styles.sidebarSubtitle,
                    {
                      fontSize: identityConfig.subtitleSize,
                      marginBottom: identityConfig.subtitleMarginBottom,
                      color: config.theme.sidebarSubtitleColor
                    }
                  ]}
                >
                {normalizePdfText(data.identity.subtitle)}
              </Text>
            ) : null}
          </>
        ) : null}

        <View style={[styles.sidebarStack, { gap: config.sidebar.blockGap }]}>
          {config.leftColumnSections.map((sectionKey) => {
            const section = getSidebarSectionItems(data, sectionKey);

            return (
              <PdfCompactSection
                key={sectionKey}
                config={config}
                title={section.title}
                items={section.items}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function PdfPageShell({
  config,
  data
}: {
  config: PdfTemplateConfig;
  data: CvPdfData;
}) {
  if (isSlateProfile(config)) {
    const orderedKeys =
      data.mainSectionOrder ?? (config.rightColumnSections as CvPdfMainSectionOrderKey[]);

    return (
      <Page size="A4" style={[styles.page, { backgroundColor: "#F3F3F1" }]}>
        <View
          style={{
            margin: 18,
            paddingHorizontal: 8,
            paddingTop: 6,
            paddingBottom: 20,
            backgroundColor: "#F3F3F1"
          }}
        >
          <View style={{ position: "relative", marginBottom: 20, minHeight: 150 }}>
            <View
              style={{
                position: "absolute",
                top: -14,
                right: -8,
                width: 210,
                height: 118,
                backgroundColor: "#E8E8E6",
                transform: "rotate(-18deg)"
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start"
              }}
            >
              <View style={{ width: "66%", paddingTop: 10, paddingLeft: 8 }}>
                <Text
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    color: "#222222",
                    fontWeight: 700,
                    marginBottom: 2
                  }}
                >
                  Lebenslauf
                </Text>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    lineHeight: 1.06,
                    color: "#222222",
                    marginBottom: 10
                  }}
                >
                  {data.identity.fullName}
                </Text>
                {data.contact.length ? (
                  <View style={{ flexDirection: "column", gap: 5 }}>
                    {buildSlateContactRows(data.contact).map((row) => (
                      <View key={row.key} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                        <View style={{ width: 14, height: 14, marginTop: 1, marginRight: 8 }}>
                          <PdfSlateContactIcon item={row.iconKey} />
                        </View>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 9.7,
                            lineHeight: 1.42,
                            color: "#4F4F4F"
                          }}
                        >
                          {normalizePdfText(row.value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
              <View style={{ width: "26%", alignItems: "center", paddingTop: 2, paddingRight: 6 }}>
                <PdfPhotoBlock
                  config={config}
                  initials={data.identity.initials}
                  photoUrl={data.identity.photoUrl}
                  preparedPhotoSrc={data.identity.preparedPhotoSrc}
                  photoPresentation={data.identity.photoPresentation}
                />
              </View>
            </View>
          </View>

          {orderedKeys.map((sectionKey) => {
            if (sectionKey === "workExperience") {
              return (
                <PdfSlateSection
                  key={sectionKey}
                  title="Berufserfahrung"
                  entries={data.workExperience}
                />
              );
            }

            if (sectionKey === "education") {
              return (
                <PdfSlateSection
                  key={sectionKey}
                  title="Ausbildung"
                  entries={data.education}
                />
              );
            }

            if (sectionKey === "additionalSections") {
              return data.additionalSections.length ? (
                <View key={sectionKey}>
                  {data.additionalSections.map((section) => (
                    <View key={section.id}>
                      <PdfSlateFreeTitle title={section.title} />
                      <View>
                        {section.bullets?.map((bullet) => (
                          <Text
                            key={`${section.id}-${bullet}`}
                            style={{
                              fontSize: 9.6,
                              lineHeight: 1.42,
                              color: "#4F4F4F",
                              marginTop: 3
                            }}
                          >
                            - {normalizePdfText(bullet)}
                          </Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null;
            }

            if (sectionKey === "customBlock") {
              return data.customBlock ? (
                <View key={sectionKey}>
                  {data.customBlock.title ? (
                    <PdfSlateFreeTitle title={data.customBlock.title} />
                  ) : null}
                  <View style={{ marginTop: data.customBlock.title ? 0 : 18 }}>
                    {data.customBlock.entries.map((entry) => (
                      <PdfSlateEntryRow key={entry.id} entry={entry} />
                    ))}
                  </View>
                </View>
              ) : null;
            }

            return null;
          })}

          {data.languages.length ? (
            <View wrap={false}>
              <PdfSlateSectionHeading title="Kenntnisse und Interessen" />
              <View style={{ flexDirection: "row" }} wrap={false}>
                <View style={{ width: 160, paddingRight: 14 }}>
                  <Text
                    style={{
                      fontSize: 9.7,
                      lineHeight: 1.5,
                      color: "#4F4F4F"
                    }}
                  >
                    Fremdsprachen
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  {data.languages.map((item) => (
                    <Text
                      key={item}
                      style={{
                        fontSize: 9.7,
                        lineHeight: 1.5,
                        color: "#4F4F4F"
                      }}
                    >
                      {normalizePdfText(item)}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </Page>
    );
  }

  if (isSoftTimeline(config)) {
    const orderedKeys =
      data.mainSectionOrder ?? (config.rightColumnSections as CvPdfMainSectionOrderKey[]);

    return (
      <Page
        size="A4"
        style={[styles.page, { backgroundColor: "#F3F3F1" }]}
      >
        <View
          style={{
            margin: 18,
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 22,
            backgroundColor: "#F3F3F1"
          }}
        >
          <PdfSoftTimelineTop config={config} data={data} />

          {orderedKeys.map((sectionKey) => {
            if (sectionKey === "workExperience") {
              return (
                <PdfTimelineSectionBlock
                  key={sectionKey}
                  title="Berufserfahrung"
                  entries={data.workExperience}
                />
              );
            }

            if (sectionKey === "education") {
              return (
                <PdfTimelineSectionBlock
                  key={sectionKey}
                  title="Ausbildung"
                  entries={data.education}
                />
              );
            }

            if (sectionKey === "customBlock") {
              return data.customBlock ? (
                <PdfCustomBlock key={sectionKey} config={config} block={data.customBlock} />
              ) : null;
            }

            const section = getMainSectionEntries(data, sectionKey);

            return (
              <PdfSectionBlock
                key={sectionKey}
                config={config}
                title={section.title}
                entries={section.entries}
                compact={false}
              />
            );
          })}

          {data.languages.length ? (
            <View style={{ marginTop: 14 }}>
              <PdfCompactSection config={config} title="Sprachen" items={data.languages} />
            </View>
          ) : null}
        </View>
      </Page>
    );
  }

  return (
    <Page
      size="A4"
      style={[styles.page, { backgroundColor: config.page.backgroundColor }]}
    >
      <View
        style={[
          styles.shell,
          {
            margin: config.shell.margin,
            borderRadius: config.shell.radius,
            backgroundColor: config.shell.backgroundColor,
            borderColor: config.shell.borderColor,
            borderWidth: config.theme.shellBorderWidth ?? 1
          }
        ]}
      >
        <PdfSidebarLayout config={config} data={data} />

        <View
          style={{
            width: getMainColumnWidth(config.sidebarWidth),
            paddingHorizontal: config.main.paddingHorizontal,
            paddingTop: config.main.paddingTop,
            paddingBottom: config.main.paddingBottom
          }}
        >
          <PdfHeaderBlock config={config} data={data} />
          {(data.mainSectionOrder ??
            (config.rightColumnSections as CvPdfMainSectionOrderKey[])).map((sectionKey) => {
            if (sectionKey === "customBlock") {
              return data.customBlock ? (
                <PdfCustomBlock key={sectionKey} config={config} block={data.customBlock} />
              ) : null;
            }

            const section = getMainSectionEntries(data, sectionKey);

            return (
              <PdfSectionBlock
                key={sectionKey}
                config={config}
                title={section.title}
                entries={section.entries}
                compact={false}
              />
            );
          })}
        </View>
      </View>
    </Page>
  );
}

export function PdfTemplateDocument({
  data,
  config
}: {
  data: CvPdfData;
  config: PdfTemplateConfig;
}) {
  return (
    <Document author="MedMatch" title={`${data.identity.fullName} - ${config.templateTitle}`}>
      <PdfPageShell config={config} data={data} />
    </Document>
  );
}
