<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template name="layer-background">
		<div class="layer-background" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='background']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-collision">
		<div class="layer-collision" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='collision']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
					<xsl:attribute name="style">
						<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
						<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
					</xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-action">
		<div class="layer-action" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='action']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
					<xsl:attribute name="style">
						<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
						<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
					</xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

</xsl:stylesheet>